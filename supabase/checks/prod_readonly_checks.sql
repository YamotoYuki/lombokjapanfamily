-- =============================================================================
-- PRODUCTION READ-ONLY CHECKS — RBAC hardening (migration 22)
--   supabase/migrations/20261006000000_harden_profiles_and_role_checks.sql
--
-- 本番の SQL Editor で、上から1ブロックずつ実行して結果を保存する。
-- このファイルは読み取りだけで構成されている（書き込み・権限変更・
-- ロール切り替え・トランザクション確定の文は1つも含まない）。
-- DO ブロックも参照と RAISE だけで、データは変えない。
-- migration 22 の適用前に1回、適用後にもう1回実行する。
--
-- =============================================================================
-- 判定基準（migration 22 を適用してよい条件 = すべて満たすこと）
-- =============================================================================
--   C1  A9  の verdict が 'OK: bypassrls' または 'OK: owns both tables'
--           （has_role の所有者が RLS をバイパスできる、または profiles と
--             user_roles の両方の所有者である。適用前でも判定できる）
--   C2  A10 が 'OK A10'（profiles / user_roles に FORCE RLS がない。
--           適用前でも判定できる）
--   C3  A11 が 'OK A11'（has_role はロール配列だけを受け取る1つだけ）
--   C4  A3  の active_admins >= 1
--   C5  L1（ロールのないユーザー）に、管理画面を使う本物のスタッフがいない
--           （いる場合は先にロールを付ける。付けないと新バックエンドで入れない）
--   C6  L3（profiles のない user_roles）が 0 件
--   C7  A7  の結果を保存した。rollback_20261006.sql がそのまま使えるのは、
--           authenticated と anon の両方に a と w があり、'*'（委譲可）が
--           なく、A7-col が 0 件のとき。違えば rollback を先に直す。
--   C8  A12 の has_role 定義を保存した。init.sql:119-135 と同じ本文なら
--           rollback_20261006.sql の定義がそのまま「適用直前の定義」になる。
--   C9  INV-1〜INV-5b と INV-M の出力を保存した（適用後との比較用）
--
-- 適用前と適用後で結果が変わる項目（適用前の「不合格」は正しい）:
--   A4  適用前: checks_status = false が正しい / 適用後: true
--   A7  適用前: authenticated / anon に a・w がある が正しい / 適用後: a・w なし
-- 適用前でも合格していなければならない項目（前提条件。不合格なら適用しない）:
--   A9  A10  A11   — migration 22 は所有者・FORCE RLS・引数を変えないので、
--                    適用前後で同じ結果になる。適用前に不合格なら、適用後に
--                    has_role の再帰やなりすましの危険があるため中止する。
-- =============================================================================


-- =============================================================================
-- L. ユーザー一覧
-- =============================================================================

-- L1 (= A1) ロールのないプロフィール。新バックエンドでは管理画面に入れない。
SELECT p.id, p.email, p.status, p.deleted_at
FROM public.profiles p
LEFT JOIN public.user_roles r ON r.user_id = p.id
WHERE r.user_id IS NULL
ORDER BY p.email COLLATE "C";

-- L2 (= A2) 停止・無効・削除済みのプロフィールと Auth 側の凍結状態。
--     banned_until が NULL の人は Auth 側で凍結されていない（適用後に対応）。
SELECT p.id, p.email, p.status, p.deleted_at, r.role, u.banned_until
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
LEFT JOIN public.user_roles r ON r.user_id = p.id
WHERE p.status <> 'active' OR p.deleted_at IS NOT NULL
ORDER BY p.email COLLATE "C";

-- L3 profiles のない user_roles（適用後の has_role では黙って拒否される）。0 件が期待値。
SELECT r.user_id, r.role
FROM public.user_roles r
LEFT JOIN public.profiles p ON p.id = r.user_id
WHERE p.id IS NULL
ORDER BY r.user_id;


-- =============================================================================
-- PART A
-- =============================================================================

-- A1 → L1 を参照。  A2 → L2 を参照。

-- A3 有効な管理者の数。>= 1 が必須（適用前・適用後とも）。
SELECT count(*) AS active_admins
FROM public.user_roles r
JOIN public.profiles p ON p.id = r.user_id
WHERE r.role = 'admin' AND p.status = 'active' AND p.deleted_at IS NULL;

-- A4 user_roles を読む関数。
--     適用前: has_role だけ、checks_status = false（不合格になるのが正しい）
--     適用後: has_role だけ、checks_status = true
SELECT n.nspname AS schema, p.proname, p.prosecdef AS security_definer,
       position('p.status = ''active''' IN p.prosrc) > 0 AS checks_status
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.prosrc ILIKE '%user_roles%'
  AND n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY n.nspname COLLATE "C", p.proname COLLATE "C";

-- A5 user_roles を直接参照するポリシー。期待値: user_roles 自身のポリシーだけ（適用前後とも）。
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE coalesce(qual, '') ILIKE '%user_roles%'
   OR coalesce(with_check, '') ILIKE '%user_roles%'
ORDER BY schemaname COLLATE "C", tablename COLLATE "C", policyname COLLATE "C";

-- A6 has_role を使わない、SELECT 以外のストレージポリシー。期待値: 0 件（適用前後とも）。
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
  AND NOT (coalesce(qual, '') || coalesce(with_check, '')) ILIKE '%has_role%'
  AND cmd <> 'SELECT'
ORDER BY policyname COLLATE "C";

-- A7 profiles に対するブラウザ側ロール（authenticated / anon）の権限。
--     ACL の文字: a = 行の追加, w = 行の書き換え, r = 読み取り, d = 行の削除,
--                 D = 全行消去, x = 参照, t = トリガー, m = 保守。'*' は委譲可。
--     適用前: 両ロールに a と w がある（不合格になるのが正しい）
--     適用後: 両ロールとも a も w もない
--     保存理由: rollback で「適用前とまったく同じ形」に戻すための記録（C7）。
SELECT split_part(acl::text, '=', 1)                          AS role,
       split_part(split_part(acl::text, '=', 2), '/', 1)      AS privilege_letters,
       split_part(acl::text, '/', 2)                          AS given_by,
       position('a' IN split_part(split_part(acl::text, '=', 2), '/', 1)) > 0 AS has_a,
       position('w' IN split_part(split_part(acl::text, '=', 2), '/', 1)) > 0 AS has_w,
       split_part(split_part(acl::text, '=', 2), '/', 1) LIKE '%a*%'          AS a_delegable,
       split_part(split_part(acl::text, '=', 2), '/', 1) LIKE '%w*%'          AS w_delegable
FROM pg_class c
CROSS JOIN LATERAL unnest(c.relacl) AS acl
WHERE c.oid = 'public.profiles'::regclass
  AND split_part(acl::text, '=', 1) IN ('authenticated', 'anon')
ORDER BY split_part(acl::text, '=', 1) COLLATE "C";

-- A7-col 列単位の ACL（profiles）。期待値: 0 件。
--     1 件でもあれば、rollback_20261006.sql はそれを戻さない（migration 22 の
--     テーブル単位の取り消しで列単位の権限も消えるため）。適用前に記録し、
--     rollback を先に直す。
SELECT a.attname,
       split_part(acl::text, '=', 1)                     AS role,
       split_part(split_part(acl::text, '=', 2), '/', 1) AS privilege_letters
FROM pg_attribute a
CROSS JOIN LATERAL unnest(a.attacl) AS acl
WHERE a.attrelid = 'public.profiles'::regclass
  AND a.attnum > 0 AND NOT a.attisdropped
  AND split_part(acl::text, '=', 1) IN ('authenticated', 'anon')
ORDER BY a.attname COLLATE "C", split_part(acl::text, '=', 1) COLLATE "C";

-- A8 新規登録トリガーが存在し、SECURITY DEFINER であること（適用前後とも）。
SELECT t.tgname, p.proname, p.prosecdef AS security_definer
FROM pg_trigger t
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE t.tgrelid = 'auth.users'::regclass AND NOT t.tgisinternal
ORDER BY t.tgname COLLATE "C";

-- A9 has_role の所有者と、その所有者が RLS をバイパスできるか（判定基準 C1）。
--     適用前でも合格している必要がある（不合格なら適用しない）。
SELECT
  p.oid::regprocedure                         AS signature,
  pg_get_userbyid(p.proowner)                 AS function_owner,
  r.rolbypassrls                              AS owner_rolbypassrls,
  r.rolsuper                                  AS owner_rolsuper,
  pg_get_userbyid(prof.relowner)              AS profiles_owner,
  pg_get_userbyid(ur.relowner)                AS user_roles_owner,
  p.prosecdef                                 AS security_definer,
  p.proconfig                                 AS function_settings,
  CASE
    WHEN r.rolbypassrls OR r.rolsuper THEN 'OK: bypassrls'
    WHEN p.proowner = prof.relowner AND p.proowner = ur.relowner
      THEN 'OK: owns both tables'
    ELSE 'FAIL: owner is subject to RLS on profiles/user_roles'
  END                                         AS verdict
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
JOIN pg_roles r ON r.oid = p.proowner
CROSS JOIN (SELECT relowner FROM pg_class WHERE oid = 'public.profiles'::regclass) prof
CROSS JOIN (SELECT relowner FROM pg_class WHERE oid = 'public.user_roles'::regclass) ur
WHERE n.nspname = 'public' AND p.proname = 'has_role';

-- A10 profiles / user_roles に FORCE RLS がないこと（判定基準 C2）。
--      適用前でも合格している必要がある。
SELECT c.oid::regclass AS table_name, c.relrowsecurity, c.relforcerowsecurity
FROM pg_class c
WHERE c.oid IN ('public.profiles'::regclass, 'public.user_roles'::regclass)
ORDER BY c.oid::regclass::text COLLATE "C";

DO $$
DECLARE
  forced text;
BEGIN
  SELECT string_agg(c.oid::regclass::text, ', ')
    INTO forced
  FROM pg_class c
  WHERE c.oid IN ('public.profiles'::regclass, 'public.user_roles'::regclass)
    AND c.relforcerowsecurity;
  IF forced IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL A10: FORCE ROW LEVEL SECURITY is ON for: %', forced;
  END IF;
  RAISE NOTICE 'OK A10: relforcerowsecurity = false on profiles and user_roles';
END $$;

-- A11 has_role の引数（判定基準 C3）。ロール配列だけを受け取る1つだけで、
--      本文が auth.uid() を使うこと。適用前でも合格している必要がある。
SELECT p.oid::regprocedure AS signature,
       pg_get_function_identity_arguments(p.oid) AS identity_args,
       position('auth.uid()' IN p.prosrc) > 0 AS uses_auth_uid
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'has_role';

DO $$
DECLARE
  overloads int;
  bad_sig text;
BEGIN
  SELECT count(*) INTO overloads
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'has_role';
  IF overloads <> 1 THEN
    RAISE EXCEPTION 'FAIL A11: expected exactly 1 public.has_role overload, found %', overloads;
  END IF;

  SELECT p.oid::regprocedure::text INTO bad_sig
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'has_role'
    AND NOT (
      p.pronargs = 1
      AND p.proargtypes[0] = 'public.app_role[]'::regtype
      AND position('auth.uid()' IN p.prosrc) > 0
    );
  IF bad_sig IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL A11: unexpected has_role signature/body: %', bad_sig;
  END IF;
  RAISE NOTICE 'OK A11: has_role(app_role[]) only; subject is auth.uid()';
END $$;

-- A12 has_role の現在の定義全文（判定基準 C8。適用前に必ず保存する）。
--      適用前: init.sql:119-135 と同じ本文（user_roles だけを見る）なら、
--      rollback_20261006.sql の定義と一致する。違えば rollback を保存した
--      定義に合わせてから適用する。
SELECT pg_get_functiondef('public.has_role(public.app_role[])'::regprocedure) AS definition;


-- =============================================================================
-- SCHEMA INVENTORY（読み取り専用・本番でも実行可）
-- 出力を CSV で保存し、適用前後（必要なら他環境と）を比較する。並び順は固定。
-- =============================================================================

-- INV-1 関数（public, storage）。拡張機能に属する関数は除外。
SELECT n.nspname                                  AS schema,
       p.proname                                  AS function,
       pg_get_function_identity_arguments(p.oid)  AS arguments,
       p.prosecdef                                AS security_definer,
       pg_get_userbyid(p.proowner)                AS owner,
       coalesce((SELECT string_agg(cfg, ', ' ORDER BY cfg COLLATE "C")
                 FROM unnest(p.proconfig) AS cfg
                 WHERE cfg LIKE 'search_path=%'), '')   AS search_path
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname IN ('public', 'storage')
  AND NOT EXISTS (SELECT 1 FROM pg_depend d
                  WHERE d.classid = 'pg_proc'::regclass AND d.objid = p.oid
                    AND d.deptype = 'e')
ORDER BY n.nspname COLLATE "C", p.proname COLLATE "C",
         pg_get_function_identity_arguments(p.oid) COLLATE "C";

-- INV-2 トリガー（public, storage, auth）。event は定義文から取り出す。
SELECT n.nspname                 AS schema,
       c.relname                 AS "table",
       t.tgname                  AS trigger,
       CASE WHEN t.tgtype & 2  = 2  THEN 'BEFORE'
            WHEN t.tgtype & 64 = 64 THEN 'INSTEAD OF'
            ELSE 'AFTER' END     AS timing,
       substring(pg_get_triggerdef(t.oid)
                 FROM '(?:BEFORE|AFTER|INSTEAD OF) (.+?) ON ') AS event,
       CASE WHEN t.tgtype & 1 = 1 THEN 'ROW' ELSE 'STATEMENT' END AS level,
       fn.nspname || '.' || f.proname AS function,
       t.tgenabled               AS enabled
FROM pg_trigger t
JOIN pg_class c      ON c.oid = t.tgrelid
JOIN pg_namespace n  ON n.oid = c.relnamespace
JOIN pg_proc f       ON f.oid = t.tgfoid
JOIN pg_namespace fn ON fn.oid = f.pronamespace
WHERE NOT t.tgisinternal
  AND n.nspname IN ('public', 'storage', 'auth')
ORDER BY n.nspname COLLATE "C", c.relname COLLATE "C", t.tgname COLLATE "C";

-- INV-3 RLS ポリシー（public, storage）
SELECT schemaname                         AS schema,
       tablename                          AS "table",
       policyname                         AS policy,
       cmd                                AS command,
       array_to_string(roles, ',')        AS roles,
       coalesce(qual, '')                 AS using_expr,
       coalesce(with_check, '')           AS with_check_expr
FROM pg_policies
WHERE schemaname IN ('public', 'storage')
ORDER BY schemaname COLLATE "C", tablename COLLATE "C", policyname COLLATE "C";

-- INV-3b テーブルごとの RLS 有効・強制と所有者（public, storage）
SELECT n.nspname AS schema, c.relname AS "table",
       c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS rls_forced,
       pg_get_userbyid(c.relowner) AS owner
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind IN ('r', 'p')
  AND n.nspname IN ('public', 'storage')
ORDER BY n.nspname COLLATE "C", c.relname COLLATE "C";

-- INV-4 制約（public）
SELECT n.nspname                  AS schema,
       c.relname                  AS "table",
       con.conname                AS constraint_name,
       CASE con.contype WHEN 'p' THEN 'PRIMARY KEY' WHEN 'u' THEN 'UNIQUE'
                        WHEN 'f' THEN 'FOREIGN KEY' WHEN 'c' THEN 'CHECK'
                        WHEN 'x' THEN 'EXCLUDE'     WHEN 't' THEN 'TRIGGER'
                        ELSE con.contype::text END AS type,
       pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class c     ON c.oid = con.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
ORDER BY n.nspname COLLATE "C", c.relname COLLATE "C", con.conname COLLATE "C";

-- INV-5 テーブル権限（authenticated / anon、public, storage）
SELECT table_schema   AS schema,
       table_name     AS "table",
       grantee        AS role,
       privilege_type AS privilege
FROM information_schema.role_table_grants
WHERE grantee IN ('authenticated', 'anon')
  AND table_schema IN ('public', 'storage')
ORDER BY table_schema COLLATE "C", table_name COLLATE "C",
         grantee COLLATE "C", privilege_type COLLATE "C";

-- INV-5b 列単位の権限（authenticated / anon、public）。テーブル単位の権限から
--        派生した行は除外し、列単位で個別に付いているものだけを出す。
SELECT cp.table_schema AS schema, cp.table_name AS "table", cp.column_name,
       cp.grantee AS role, cp.privilege_type AS privilege
FROM information_schema.column_privileges cp
WHERE cp.grantee IN ('authenticated', 'anon')
  AND cp.table_schema = 'public'
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.role_table_grants tg
    WHERE tg.table_schema   = cp.table_schema
      AND tg.table_name     = cp.table_name
      AND tg.grantee        = cp.grantee
      AND tg.privilege_type = cp.privilege_type)
ORDER BY cp.table_schema COLLATE "C", cp.table_name COLLATE "C",
         cp.column_name COLLATE "C", cp.grantee COLLATE "C",
         cp.privilege_type COLLATE "C";

-- INV-M schema_migrations（CLI で適用した場合だけ意味がある）
SELECT to_regclass('supabase_migrations.schema_migrations') IS NOT NULL
       AS schema_migrations_exists;
-- true の場合のみ、次の比較を実行する（false でこれを実行するとエラーになる）。
-- リポジトリの 22 件に対する適用状況（適用前は 21 件が true の想定）:
-- SELECT e.version AS expected_version,
--        (m.version IS NOT NULL) AS applied
-- FROM (VALUES ('20260315000000'), ('20260315000001'), ('20260315000002'),
--              ('20260315000003'), ('20260315000004'), ('20260315000005'),
--              ('20260315000006'), ('20260315000007'), ('20260315000008'),
--              ('20260315000009'), ('20260315000010'), ('20260315000011'),
--              ('20260315000012'), ('20260315000013'), ('20260315000014'),
--              ('20260331000000'), ('20260331000001'), ('20260908000000'),
--              ('20260909000000'), ('20260914000000'), ('20260925000000'),
--              ('20261006000000')) AS e(version)
-- LEFT JOIN supabase_migrations.schema_migrations m ON m.version = e.version
-- ORDER BY e.version;
-- リポジトリに無いのに記録されているもの:
-- SELECT version FROM supabase_migrations.schema_migrations
-- WHERE version NOT IN ('20260315000000','20260315000001','20260315000002',
--   '20260315000003','20260315000004','20260315000005','20260315000006',
--   '20260315000007','20260315000008','20260315000009','20260315000010',
--   '20260315000011','20260315000012','20260315000013','20260315000014',
--   '20260331000000','20260331000001','20260908000000','20260909000000',
--   '20260914000000','20260925000000','20261006000000')
-- ORDER BY version;
