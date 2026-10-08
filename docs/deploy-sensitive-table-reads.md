# 機密テーブルの直接読み取りを制限（本番適用手順）

対象 migration：`supabase/migrations/20261008000002_restrict_sensitive_table_reads.sql`
動作確認 SQL：`supabase/checks/20261008_table_read_checks.sql`

> **状態：未適用。** この migration と SQL は、まだどの環境にも適用していません。

## 0. 何を塞ぐのか

viewer が、公開されている anon キーと自分のログイン情報を使って、Supabase の API（PostgREST）から次のデータを**直接**読めます。Flask API と管理画面では拒否しているのに、DB 側の権限（RLS）が許可しているためです。

- お問い合わせ全件：氏名・メール・電話・本文・社内メモ
- スポンサー案件全件：金額・連絡先・添付URL
- 全ユーザーのメールアドレス・状態（`profiles`）と、全ユーザーのロール（`user_roles`）

## 1. 事前調査の結果（2026-10-08 時点のコード）

| 確認項目 | 結果 |
|---|---|
| フロントエンドがテーブルや Storage を直接使っているか | **使っていない。** `supabase.from(...)`・`supabase.storage`・`rpc` の使用箇所は0件。使っているのは `supabase.auth.*`（ログイン状態・MFA・パスワード変更）だけで、データの読み書きはすべて `/api/*` 経由 |
| バックエンドの接続キー | `SUPABASE_SERVICE_ROLE_KEY`（service role）。RLS の影響を受けないため、この変更でバックエンドの動作は変わらない |
| 注意点 | 起動時のチェック（`utils/env_check.py`）は、キーが service role かどうかまでは確認していない。誤って anon キーが設定されていると、変更後にバックエンドがお問い合わせ等を読めなくなる（2章で事前確認する） |
| `has_role()` | `SECURITY DEFINER`（`20261006000000` の定義）。関数の所有者の権限で `user_roles` / `profiles` を読むため、今回のポリシー変更の影響を受けない |
| 新規ユーザーへのロール自動付与 | **無い。** トリガー `on_auth_user_created` → `handle_new_user()`（`SECURITY DEFINER`）が作るのは `profiles` の行だけ。ロールは admin が CMS で付ける（ロールの無い人は管理画面に入れない） |
| 補足 | `20260315000007` の最後に、その時点でロールが無かった既存ユーザーに viewer を付ける**1回限りの** INSERT がある（以後の新規ユーザーには付かない） |

## 2. 変更内容

| テーブル | ポリシー（同じ名前で作り直す） | 変更前（SELECT） | 変更後（SELECT） |
|---|---|---|---|
| `contacts` | `contacts_select` | admin・editor・viewer | admin・editor |
| `sponsors` | `sponsors_select` | admin・editor・viewer | admin・editor |
| `profiles` | `profiles_select` | 自分の行、または admin・editor・viewer なら全員分 | 自分の行、または admin なら全員分 |
| `user_roles` | `user_roles_select` | 自分の行、または admin・editor・viewer なら全員分 | 自分の行、または admin なら全員分 |

**削除して作り直すポリシーはこの4つだけです。** INSERT・UPDATE・DELETE のポリシー、ほかのテーブル、`has_role()`、テーブル権限（GRANT）は変更しません。

editor に全員分の `profiles` / `user_roles` を読ませる必要はありません。
- 画面はこの2つのテーブルを直接読まない（ユーザー管理は admin 専用の `/api/users`）
- `has_role()` は `SECURITY DEFINER` なので、ポリシーの影響を受けない

変更後に誰が何を読めるか：

| | admin | editor | viewer | ロール無し |
|---|---|---|---|---|
| お問い合わせ・スポンサー | 全件 | 全件 | 読めない | 読めない |
| 自分の `profiles` / `user_roles` | 読める | 読める | 読める | 読める |
| 他人の `profiles` / `user_roles` | 読める | 読めない | 読めない | 読めない |

## 3. 事前確認（本番 SQL Editor・読み取りのみ）

- [ ] **バックエンドのキーが service role であること**を確認した。Render の `SUPABASE_SERVICE_ROLE_KEY` が、Supabase Dashboard > Settings > API の service_role（secret）キーと一致している（anon / publishable キーではない）
- [ ] 対象4テーブルの現在のポリシーを表示し、出力を保存した（切り戻し時の比較用）：

```sql
SELECT tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('contacts', 'sponsors', 'profiles', 'user_roles')
ORDER BY tablename, cmd, policyname;
```

  確認すること：
  - SELECT のポリシーが `contacts_select`・`sponsors_select`・`profiles_select`・`user_roles_select` の4つだけである
  - **ほかの名前の SELECT ポリシー（ダッシュボードから手で追加したものなど）が無い。** ある場合は、それも viewer に読み取りを許している可能性があるため、作業を中止して報告する（ポリシーは「どれか1つでも許可すれば読める」ため、この migration だけでは塞がらない）

- [ ] `has_role()` が `SECURITY DEFINER` であることを確認した：

```sql
SELECT p.proname, p.prosecdef, pg_get_userbyid(p.proowner) AS owner
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'has_role';
-- prosecdef = true であること
```

- [ ] 動作確認に使う、有効な admin・editor・viewer を1名ずつ決めた（`supabase/checks/20261008_table_read_checks.sql` の冒頭の UUID を置き換える）

## 4. 適用

- [ ] `20261008000002_restrict_sensitive_table_reads.sql` を適用した
  - CLI：`supabase db push`
  - SQL Editor：ファイル全体をまとめて実行する（この場合 `schema_migrations` には記録されない）
- [ ] 3章のポリシー一覧の SQL を再実行し、4つのポリシーが2章の「変更後」になっていることを確認した

`20261008000000` / `20261008000001`（Storage）とは独立しているので、どちらを先に適用しても構いません。

## 5. 適用後の確認

### 5.1 DB の動作確認

- [ ] `supabase/checks/20261008_table_read_checks.sql` を実行し、各ロールで `OK` が出た（`BEGIN … ROLLBACK` の中で実行するので、データは変更されない）
  - admin：お問い合わせ・スポンサー・profiles・user_roles とも全件
  - editor：お問い合わせ・スポンサーは全件、profiles・user_roles は自分の1行
  - viewer：お問い合わせ・スポンサーは0件、profiles・user_roles は自分の1行
  - `SKIP` や `NOT VERIFIED` は合格ではない。対象者がいない、またはテーブルが空のときは「未確認」として記録する
- [ ] 既存の `20261006_rbac_hardening_checks.sql` の PART B も引き続き OK（B2・B3 は editor による contacts の読み取り、B4 は admin による user_roles の読み取りを使うが、どちらも許可されたまま）

### 5.2 画面の確認

- [ ] admin：ダッシュボード、ユーザー管理、お問い合わせ一覧・詳細が表示できる
- [ ] editor：お問い合わせ一覧・詳細が表示でき、ステータスを更新できる
- [ ] viewer：ログインでき、ダッシュボードと分析が表示できる
- [ ] 公開サイトのお問い合わせフォームから送信でき、管理画面に表示される（バックエンドの service role で保存するので影響しない）

## 6. 切り戻し

SQL Editor でファイル全体をまとめて実行する（変更前の定義に戻す）：

```sql
DROP POLICY IF EXISTS contacts_select ON public.contacts;
CREATE POLICY contacts_select ON public.contacts
  FOR SELECT TO authenticated
  USING (public.has_role(ARRAY['admin', 'editor', 'viewer']::public.app_role[]));

DROP POLICY IF EXISTS sponsors_select ON public.sponsors;
CREATE POLICY sponsors_select ON public.sponsors
  FOR SELECT TO authenticated
  USING (public.has_role(ARRAY['admin', 'editor', 'viewer']::public.app_role[]));

DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR public.has_role(ARRAY['admin', 'editor', 'viewer']::public.app_role[])
  );

DROP POLICY IF EXISTS user_roles_select ON public.user_roles;
CREATE POLICY user_roles_select ON public.user_roles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(ARRAY['admin', 'editor', 'viewer']::public.app_role[])
  );
```

- CLI で適用していた場合は、`supabase migration repair --status reverted 20261008000002` で記録も戻す。
- 戻した後に 3章のポリシー一覧を再実行し、事前確認で保存した出力と一致することを確認する。

すぐ切り戻す症状：

- 有効な admin・editor が、管理画面でお問い合わせ・ユーザー管理を表示できない、またはバックエンドのログに権限エラー（`permission denied` / 0件）が出る
  - バックエンドは service role なので本来は影響しない。まず 3章の「キーが service role か」を確認する
- ログインや画面全体の表示（`/api/auth/session`）が失敗する

戻さない（想定どおりの動作）：

- viewer が Supabase API から直接お問い合わせ・スポンサー・他人のプロフィールを読めない

## 7. 残っている事項（今回の範囲外）

- viewer は引き続き、次のテーブルを直接読めます（未公開のものも含む）。いずれも管理画面で viewer に見せている、または公開予定の内容で、個人情報・金額は含みません：`posts`（下書きを含む）、`videos`、`gallery`、`family_profiles`、`announcements`、`notification_banners`、`analytics_*`、`post_tags` など
- 必要であれば、別の作業として「viewer は公開済みのものだけ」に絞ることを検討してください
