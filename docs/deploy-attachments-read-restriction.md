# 添付ファイル・スポンサー情報の読み取りを admin・editor に限定（本番適用手順）

対象：

| 変更 | 種類 | ファイル |
|---|---|---|
| `attachments` バケット（お問い合わせの添付）の読み取りを admin・editor に限定 | DB migration | `supabase/migrations/20261008000000_restrict_attachments_read.sql` |
| `sponsor-files` バケット（スポンサーの添付）の読み取りを admin・editor に限定 | DB migration | `supabase/migrations/20261008000001_restrict_sponsor_files_read.sql` |
| スポンサーの詳細・一覧・集計 API を admin・editor に限定 | バックエンド | `backend/routes/sponsor_routes.py` |
| ダッシュボードのスポンサー表示を editor 以上だけにする（`FEATURES.sponsors` が有効なとき） | フロントエンド | `src/pages/admin/DashboardPage.tsx` |

> **状態：未適用。** この手順書の migration と SQL は、まだどの環境にも適用していません。

DB の変更とアプリの変更は互いに依存していないので、どちらを先に行っても構いません。2つの migration も独立しており、まとめて適用しても1つずつ適用しても構いません。

---

## 1. 変更の内容

### 1.1 Storage（migration）

| ポリシー | 変更前 | 変更後 |
|---|---|---|
| `ljf_attachments_auth_read`（`attachments`・SELECT） | admin・editor・**viewer** | admin・editor |
| `ljf_sponsor_files_select`（`sponsor-files`・SELECT） | admin・editor・**viewer** | admin・editor |
| 両バケットの INSERT / UPDATE（admin・editor）、DELETE（admin） | 変更なし | 変更なし |

- `has_role()` は 20261006 の定義（停止・削除済みのアカウントを除外する）をそのまま使います。
- バックエンドは service role で接続しているため、この変更の影響を受けません。

### 1.2 スポンサー API（バックエンド）

| API | 変更前 | 変更後 |
|---|---|---|
| `GET /api/sponsors/<id>`（詳細） | `require_staff()`（viewer 可） | `require_editor()` |
| `GET /api/sponsors`（一覧。`select("*")` なので連絡先・金額・添付URLも返る） | `require_staff()` | `require_editor()` |
| `GET /api/sponsors/stats`（集計。売上・最近の案件） | `require_staff()` | `require_editor()` |
| 作成・更新・削除・アップロード | `require_editor()` | 変更なし |

- viewer には 403 `forbidden` を返します（操作単位の拒否なので、画面はログアウトしません）。
- 画面側の確認：
  - スポンサーの画面はすべて `RequireEditor` の配下にあり、さらに `FEATURES.sponsors = false` で非表示です。
  - ダッシュボードは、これまで `FEATURES.sponsors` が有効なら viewer にもスポンサーの集計（売上・最近の案件）を表示する作りでした。そのため、表示条件を「フラグが有効」かつ「admin または editor」に変更しました。現在はフラグが無効なので、見た目は変わりません。

---

## 2. 事前確認（本番 SQL Editor・読み取りのみ）

- [ ] `storage.objects` のポリシーをすべて表示し、出力を保存した（ダッシュボードから手で追加したポリシーが無いかの確認も兼ねる）：

```sql
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY cmd, policyname;
```

  確認すること：
  - `ljf_attachments_auth_read` と `ljf_sponsor_files_select` が `has_role(ARRAY['admin','editor','viewer'])` になっている（変更前の状態）
  - `cmd = SELECT` の行のうち、この2つ以外に `attachments` または `sponsor-files` を読めるもの（`bucket_id` で絞り込んでいないもの、`ljf_` 以外の名前のものを含む）が**無い**。ある場合は、この migration だけでは viewer の読み取りを止められないため、作業を中止して報告する

- [ ] 有効な admin と editor がそれぞれ1名以上いる。viewer がいるかどうかも確認した：

```sql
SELECT r.role, count(*)
FROM public.user_roles r JOIN public.profiles p ON p.id = r.user_id
WHERE p.status = 'active' AND p.deleted_at IS NULL
GROUP BY r.role;
```

## 3. 適用

- [ ] `20261008000000_restrict_attachments_read.sql` を適用した
- [ ] `20261008000001_restrict_sponsor_files_read.sql` を適用した
  - CLI：`supabase db push`（2つとも順に適用される）
  - SQL Editor：ファイルごとに全体をまとめて実行する（この場合 `schema_migrations` には記録されない）
- [ ] 2章の最初の SQL を再実行し、2つのポリシーが `has_role(ARRAY['admin','editor'])` になっていることを確認した

## 4. 適用後の確認

### 4.1 権限の動作確認（SQL Editor・データは変更しない）

`<viewer-uuid>` / `<editor-uuid>` は、2章で確認した有効なユーザーに置き換えます。

```sql
-- viewer：両方 0 件になること
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims',
  json_build_object('sub', '<viewer-uuid>', 'role', 'authenticated')::text, true);
SELECT bucket_id, count(*) AS viewer_sees
FROM storage.objects
WHERE bucket_id IN ('attachments', 'sponsor-files')
GROUP BY bucket_id;   -- 行が返らない = 0 件
ROLLBACK;

-- editor：各バケットの件数と同じになること
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims',
  json_build_object('sub', '<editor-uuid>', 'role', 'authenticated')::text, true);
SELECT bucket_id, count(*) AS editor_sees
FROM storage.objects
WHERE bucket_id IN ('attachments', 'sponsor-files')
GROUP BY bucket_id;
ROLLBACK;
```

- [ ] viewer：両バケットとも 0 件（行が返らない）
- [ ] editor：各バケットの件数と同じ（Dashboard > Storage で件数を確認）。空のバケットは「未確認」として記録する（合格扱いにしない）
- [ ] 有効な viewer がいない場合、viewer 側は「対象者なし・未確認」として記録する

### 4.2 画面・API の確認

- [ ] editor でログインし、お問い合わせ詳細から添付ファイルを開ける（現在の署名付きURL方式。期限内のものを使う）
- [ ] admin も同様に開ける
- [ ] 新しい問い合わせ（添付あり）を送信でき、管理画面に表示される（アップロードはバックエンドの service role なので影響しない）
- [ ] バックエンドをデプロイした後：editor・admin はスポンサーの詳細・一覧・集計 API で 200、viewer は 403
- [ ] viewer でログインし、ダッシュボードがエラーなく表示される（スポンサーの表示は出ない）

## 5. 残っている事項

viewer が使える API とバケットの全体の調査結果は、作業報告を参照してください。このデプロイの範囲では、スポンサー関連で viewer が読めるものは残りません。

## 6. 切り戻し

### 6.1 Storage（migration）を戻す

SQL Editor で実行する（変更前の定義に戻す。片方だけ戻すこともできる）：

```sql
-- attachments
DROP POLICY IF EXISTS ljf_attachments_auth_read ON storage.objects;
CREATE POLICY ljf_attachments_auth_read
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'attachments'
    AND public.has_role(ARRAY['admin', 'editor', 'viewer']::public.app_role[])
  );

-- sponsor-files
DROP POLICY IF EXISTS ljf_sponsor_files_select ON storage.objects;
CREATE POLICY ljf_sponsor_files_select
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'sponsor-files'
    AND public.has_role(ARRAY['admin', 'editor', 'viewer']::public.app_role[])
  );
```

- CLI で適用していた場合は、記録も戻す：
  `supabase migration repair --status reverted 20261008000001`（sponsor-files）、`supabase migration repair --status reverted 20261008000000`（attachments）
- 戻した後に 2章の SQL を再実行し、定義が事前確認で保存したものと一致することを確認する。

すぐ切り戻す症状：

- 有効な editor・admin が、管理画面から添付ファイルを開けなくなった（4.1 で editor が 0 件、かつバケットは空ではない）
- 戻さない（想定どおりの動作）：viewer が Storage から添付を読めない

### 6.2 スポンサー API・ダッシュボードを戻す

直前のバックエンド（とフロントエンド）を再デプロイする（DB の変更は無い）。
