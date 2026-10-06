# RBAC 強化（A-1 / A-2 / A-4 / A-7）本番デプロイ手順

対象ブランチ: `security/harden-admin-rbac`
対象 migration: `supabase/migrations/20261006000000_harden_profiles_and_role_checks.sql`（以下「migration 22」）

staging は使わない軽量版です。本番で読み取り専用の確認をしてから migration 22 を適用し、問題があれば `supabase/checks/rollback_20261006.sql` で数分以内に戻します。

関連ファイル:

| ファイル | 用途 |
|---|---|
| `supabase/checks/prod_readonly_checks.sql` | 本番で実行する読み取り専用チェック（適用前・適用後） |
| `supabase/checks/rollback_20261006.sql` | migration 22 の取り消し |
| `supabase/checks/20261006_rbac_hardening_checks.sql` | PART B（適用後の動作確認） |

---

## 1. 事前準備（デプロイ前日〜当日）

- [ ] **`prod_readonly_checks.sql` を本番 SQL Editor で実行し、全出力を保存した**（CSV またはスクリーンショット）
- [ ] 冒頭の判定基準 C1〜C9 をすべて満たした
  - [ ] C1 A9: `verdict` が `OK: bypassrls` または `OK: owns both tables`
  - [ ] C2 A10: `OK A10`（profiles / user_roles に FORCE RLS なし）
  - [ ] C3 A11: `OK A11`
  - [ ] C4 A3: `active_admins >= 1`
  - [ ] C6 L3: 0 件
  - [ ] C7 A7: authenticated と anon の両方に `a` と `w` があり、`*` がなく、A7-col が 0 件。違う場合は `rollback_20261006.sql` を先に直した
  - [ ] C8 A12: 保存した `has_role` の定義が `rollback_20261006.sql` の定義と同じ。違う場合はロールバック側を保存した定義に合わせた
- [ ] 適用前の「不合格」は正しいことを理解した: **A4（`checks_status = false`）と A7（`a`・`w` あり）**。A9〜A11 は適用前でも合格している必要がある
- [ ] **ロールのないスタッフにロールを付けた**（C5 / L1）
  - 新しいバックエンドでは、ロールのない人は管理画面に入れない（403 `role_missing`）
  - 現在の本番バックエンドは、ロールのない人へのロール付与で失敗する不具合（`maybe_single`）がある。そのため次のどちらかで対応する
    - SQL Editor で `user_roles` に直接追加する（下の例）
    - 新しいバックエンドのデプロイ後に、admin が画面から付ける（それまでその人は入れない）

    ```sql
    -- 例: 対象者の UUID と付けるロールを確認してから実行
    INSERT INTO public.user_roles (user_id, role) VALUES ('<uuid>', 'editor');
    ```
- [ ] **Supabase Dashboard で新規登録（Allow new users to sign up）がオフになっていることを確認した**
  - コードでは確認できない設定。メニューの位置や名称はダッシュボードの版で異なる場合がある
- [ ] 作業中に連絡が取れる admin が 2 名以上いる（A-4 の保護と、万一の復旧のため）

## 2. デプロイの順番

順番は **バックエンド → フロントエンド → 時間を置く → migration 22** です。

1. [ ] **バックエンドをデプロイ**
   - 旧フロントエンドとの互換性あり: ログイン API の応答形式は同じで、`/api/auth/session` は追加のみ
   - 確認: admin でログインできる、editor でログインできる
2. [ ] **フロントエンドをデプロイ**
   - 確認: 新しい画面で admin・editor がログインできる
   - 確認: editor には完全削除ボタンが出ない
3. [ ] **時間を置く（Service Worker のキャッシュ対策）**
   - PWA（Workbox、`registerType: 'autoUpdate'`）のため、ブラウザによっては旧フロントエンドがしばらく動き続ける
   - 推奨は 24 時間、最低でも数時間。新しいシークレットウィンドウで新しい画面が出ることを確認する
   - 下の 2-1 のとおり、旧フロントエンドは migration 22 と組み合わせても壊れない。待つのは安全のための余裕
4. [ ] **migration 22 を本番に適用**
   - 適用方法（CLI / SQL Editor）を決めておく。SQL Editor で適用した場合、`schema_migrations` には記録されない
5. [ ] 直後に「3. 適用直後の確認」を行う

### 2-1. 旧フロントエンドの `last_login_at` 更新について（コードで確認済み）

旧フロントエンド（`main` の `src/contexts/AuthContext.tsx`、ログイン処理の最後）は次のように書かれています。

```ts
void supabase.from('profiles').update({ last_login_at: ... }).eq('id', userId);
return { error: null };
```

- `@supabase/postgrest-js`（2.112.3）のクエリは、`.then()` が呼ばれたときに初めて通信します（`dist/index.mjs` の `then()` 内で `fetch`）。`void` を付けただけでは `.then()` が呼ばれないため、**このリクエストは送信されていません**。
- 仮に送信されても、`throwOnError()` を使っていない（`main` の `src` に使用箇所なし）ので失敗は例外にならず、直後の `return { error: null }` でログインは完了します。
- **結論: migration 22 で profiles の UPDATE 権限がなくなっても、旧フロントエンドのログインは止まらない。** 補足すると、旧フロントエンドの `last_login_at` 更新は、もともと実行されていなかった。

## 3. 適用直後の確認（migration 22 適用後すぐ）

- [ ] **admin でログイン**し、ダッシュボード・ユーザー管理・設定が表示できる
- [ ] **editor でログイン**し、動画・ブログ・お問い合わせ一覧が表示できる
- [ ] `prod_readonly_checks.sql` を再実行
  - A4: `checks_status = true`
  - A7: authenticated と anon に `a`・`w` がない
  - A9・A10・A11: 合格のまま
  - INV-1〜INV-5b: 適用前との差分が `has_role` と profiles の権限だけであること
- [ ] `20261006_rbac_hardening_checks.sql` の **PART B（B1〜B5）**を、下の「6. 本番で PART B を流すときの注意」に従って実行し、全ブロック OK

## 4. ロールバックの判断基準

### すぐ `rollback_20261006.sql` を実行する症状（migration 22 が原因になりうるもの）

- [ ] PART B の **B4 が FAIL**（有効な admin が `has_role(admin)` を失った）
- [ ] PART B の **B2+ / B3+ が FAIL**（有効な editor が `contacts` を読めない）
- [ ] DB ログや API で **`infinite recursion detected in policy` / `stack depth limit exceeded`** が profiles・user_roles・ストレージへのアクセスで出る（A9・A10 の前提が崩れている）
- [ ] 有効な admin・editor のアカウントで、Supabase への直接アクセス（ストレージ、旧フロントエンドのロール読み込み）が拒否される
- [ ] 新規ユーザー作成（CMS の「Adminを追加」）で、profiles の作成エラーが出る
- [ ] DB の応答が大きく遅くなり、タイムアウトが出る（`has_role` が profiles を結合するようになったため）

実行方法: SQL Editor で `rollback_20261006.sql` を**ファイル全体まとめて**実行し、最後の確認用 SELECT を保存する。
CLI で適用していた場合は `schema_migrations` に `20261006000000` が残るので、再適用する前に
`supabase migration repair --status reverted 20261006000000` で記録を戻す（または記録を手動で調整する）。

### ロールバックしない（想定どおりの動作）

- 停止・削除済みのユーザーが拒否される
- ロールのないユーザーが拒否される（これは**バックエンド**の変更によるもので、migration 22 を戻しても変わらない）
- editor が完全削除できない（バックエンドの A-7）

### DB ではなくアプリを戻すべき症状

- 有効な admin・editor がログインできない、または画面全体が「再読み込み」表示になる
  → まず `/api/auth/session` の応答（401・403・503）とバックエンドのログを確認する。原因がアプリなら、**直前のバックエンドとフロントエンドに戻す**（migration 22 を戻しても直らない）。

## 5. 適用後の作業

- [ ] **既に停止・削除されているユーザーの Auth 側の凍結**（`prod_readonly_checks.sql` の L2 で `banned_until` が NULL の人）
  - 推奨: Supabase Dashboard > Authentication > Users で対象者を Ban する（ダッシュボードに Ban がない場合は、SQL Editor で `UPDATE auth.users SET banned_until = now() + interval '100 years' WHERE id = '<uuid>';`）
  - CMS で「再開 → 停止」をし直す方法もあるが、その間は一瞬アカウントが有効になるため推奨しない
- [ ] 1 週間ほど経過を見てから、ロールバック手順の待機を終える
- [ ] **A-4 の復旧手順**（管理者が 0 人になった場合）: 下の「7. 管理者 0 人からの復旧」を参照
  - 参考として、staging 用の手順書 `supabase/checks/staging_runbook_rbac.sql` の R0〜R7 にも同じ内容がある（未コミット）。ただし本番では動かないよう、staging 用テストユーザーの存在確認で停止する作りになっている

## 6. 本番で PART B を流すときの注意

- 各ブロックは `BEGIN … ROLLBACK` で囲まれており、**データは確定しない**。ロールの切り替えと JWT の設定も、そのトランザクションの中だけで有効
- **B2・B3 は、実在する有効な editor 1 名の profiles 行を、トランザクションの中で一時的に「停止」や「削除済み」に変える**
  - ROLLBACK で元に戻るが、その間はその行がロックされ、同じ editor のプロフィール更新が一瞬待たされる
  - 利用の少ない時間帯に、**1 ブロックずつ** BEGIN から ROLLBACK まで続けて実行する
- 前提として、有効な editor 1 名以上・有効な admin 1 名以上・`contacts` 1 件以上・`settings` 1 件以上が必要。足りない場合は `PRECONDITION` で止まる。本番データを増やしてまで実行しない
- 途中でエラーになったら、**すぐに `ROLLBACK;`** を実行してから原因を確認する。中断したトランザクションの上で次の BEGIN を実行しない
- **B6、T ブロック（T1〜T5）、R ブロック（R0〜R7）は本番で実行しない**
  - これらは `staging_runbook_rbac.sql` にある staging 専用のもの
  - データを確定させるブロック（T2・T3・R0・R2・R5・R6）を含む
- ストレージの `SKIP` は合格ではない（未確認として記録する）

## 7. 管理者 0 人からの復旧（A-4）

本番で実行する場合も、**信頼できる 1 名だけ**を対象に、SQL Editor で実行します。

```sql
-- 1) 状況確認（読み取りのみ）
SELECT u.email, p.id, p.status, p.deleted_at, r.role, u.banned_until
FROM auth.users u
LEFT JOIN public.profiles p   ON p.id = u.id
LEFT JOIN public.user_roles r ON r.user_id = u.id
ORDER BY (r.role = 'admin') DESC NULLS LAST, u.email;

-- 2) 1 名を有効な admin に戻す（UUID を置き換え。確認してから COMMIT）
BEGIN;
UPDATE public.profiles SET status = 'active', deleted_at = NULL WHERE id = '<uuid>';
UPDATE public.user_roles SET role = 'admin' WHERE user_id = '<uuid>';
INSERT INTO public.user_roles (user_id, role)
  SELECT '<uuid>', 'admin'
  WHERE NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = '<uuid>');
SELECT count(*) AS active_admins
FROM public.user_roles r JOIN public.profiles p ON p.id = r.user_id
WHERE r.role = 'admin' AND p.status = 'active' AND p.deleted_at IS NULL;  -- 1 以上なら COMMIT、0 なら ROLLBACK
COMMIT;

-- 3) Auth 側の凍結解除
--    第一候補: Dashboard > Authentication > Users > 対象者 > Unban
--    ダッシュボードに操作がない場合:
--    UPDATE auth.users SET banned_until = NULL WHERE id = '<uuid>';

-- 4) 監査ログに記録
INSERT INTO public.audit_logs (user_id, action, target_type, target_id, meta)
VALUES (NULL, 'ADMIN_RECOVERED_MANUALLY', 'user', '<uuid>',
        jsonb_build_object('via', 'sql_editor', 'operator', '<作業者名>'));
```

復旧後は、バックエンドの認証キャッシュが切れるまで 30 秒ほど待ってからログインしてください。
