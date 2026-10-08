# 添付ファイルの読み取り権限を admin・editor に限定（本番適用手順）

対象：

| 変更 | 種類 | ファイル |
|---|---|---|
| `attachments` バケット（お問い合わせの添付）の読み取りを admin・editor に限定 | DB migration | `supabase/migrations/20261008000000_restrict_attachments_read.sql` |
| スポンサー詳細 API（`GET /api/sponsors/<id>`）を admin・editor に限定 | バックエンド | `backend/routes/sponsor_routes.py` |

> **状態：未適用。** この手順書の migration と SQL は、まだどの環境にも適用していません。

2つの変更は互いに依存していないので、どちらを先に行っても構いません。

---

## 1. 変更の内容

### 1.1 Storage（migration）

| ポリシー | 変更前 | 変更後 |
|---|---|---|
| `ljf_attachments_auth_read`（SELECT） | admin・editor・**viewer** | admin・editor |
| `ljf_attachments_insert` / `_update`（admin・editor） | 変更なし | 変更なし |
| `ljf_attachments_delete`（admin） | 変更なし | 変更なし |

- `has_role()` は 20261006 の定義（停止・削除済みのアカウントを除外する）をそのまま使います。
- バックエンドは service role で接続しているため、この変更の影響を受けません。
- **`sponsor-files` バケットは変更しません。** `ljf_sponsor_files_select` には viewer が残ります（5章）。

### 1.2 スポンサー詳細 API（バックエンド）

- `require_staff()`（viewer も可）から `require_editor()` に変更しました。viewer には 403 `forbidden` を返します（操作単位の拒否なので、画面はログアウトしません）。
- 一覧 `GET /api/sponsors` と集計 `GET /api/sponsors/stats` は**変更していません**（5章）。
- フロントエンドで viewer がスポンサー詳細 API を呼んでいる箇所はありません。
  - スポンサーの画面はすべて `RequireEditor` の配下にあり、さらに `FEATURES.sponsors = false` で非表示です。
  - ダッシュボードのスポンサー集計も `FEATURES.sponsors` で無効になっています。

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
  - `ljf_attachments_auth_read` が `has_role(ARRAY['admin','editor','viewer'])` になっている（変更前の状態）
  - `cmd = SELECT` の行のうち、`ljf_attachments_auth_read` 以外に `attachments` を読めるもの（`bucket_id` で絞り込んでいないもの、`ljf_` 以外の名前のものを含む）が**無い**。ある場合は、この migration だけでは viewer の読み取りを止められないため、作業を中止して報告する

- [ ] 有効な admin と editor がそれぞれ1名以上いる。viewer がいるかどうかも確認した：

```sql
SELECT r.role, count(*)
FROM public.user_roles r JOIN public.profiles p ON p.id = r.user_id
WHERE p.status = 'active' AND p.deleted_at IS NULL
GROUP BY r.role;
```

## 3. 適用

- [ ] `20261008000000_restrict_attachments_read.sql` を適用した
  - CLI：`supabase db push`
  - SQL Editor：ファイル全体をまとめて実行する（この場合 `schema_migrations` には記録されない）
- [ ] 2章の最初の SQL を再実行し、`ljf_attachments_auth_read` が `has_role(ARRAY['admin','editor'])` になっていることを確認した

## 4. 適用後の確認

### 4.1 権限の動作確認（SQL Editor・データは変更しない）

`<viewer-uuid>` / `<editor-uuid>` は、2章で確認した有効なユーザーに置き換えます。

```sql
-- viewer：0 件になること
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims',
  json_build_object('sub', '<viewer-uuid>', 'role', 'authenticated')::text, true);
SELECT count(*) AS viewer_sees FROM storage.objects WHERE bucket_id = 'attachments';
ROLLBACK;

-- editor：バケット内の件数と同じになること（バケットが空なら 0）
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims',
  json_build_object('sub', '<editor-uuid>', 'role', 'authenticated')::text, true);
SELECT count(*) AS editor_sees FROM storage.objects WHERE bucket_id = 'attachments';
ROLLBACK;
```

- [ ] viewer：0 件
- [ ] editor：バケット内の件数と同じ（Dashboard > Storage > attachments で件数を確認）。バケットが空の場合は「未確認」として記録する（合格扱いにしない）
- [ ] 有効な viewer がいない場合、viewer 側は「対象者なし・未確認」として記録する

### 4.2 画面・API の確認

- [ ] editor でログインし、お問い合わせ詳細から添付ファイルを開ける（現在の署名付きURL方式。期限内のものを使う）
- [ ] admin も同様に開ける
- [ ] 新しい問い合わせ（添付あり）を送信でき、管理画面に表示される（アップロードはバックエンドの service role なので影響しない）
- [ ] バックエンドをデプロイした後：editor・admin はスポンサー詳細 API で 200、viewer は 403

## 5. 今回変更していないもの（報告事項）

| 対象 | 現状 | 推奨 |
|---|---|---|
| `sponsor-files` バケットの読み取り（`ljf_sponsor_files_select`） | **viewer も読める** | `attachments` と同じく admin・editor に限定する（別 migration） |
| スポンサー一覧 `GET /api/sponsors` | viewer も可（`require_staff`）。`select("*")` なので **`attachment_url` や連絡先も一覧で返る** | 詳細を限定した意味を保つには、一覧も editor 以上にするか、viewer 向けに返す項目を絞る |
| スポンサー集計 `GET /api/sponsors/stats` | viewer も可 | 金額の集計のみ。必要に応じて判断する |

## 6. 切り戻し

### 6.1 Storage（migration）を戻す

SQL Editor で実行する（変更前の定義に戻す）：

```sql
DROP POLICY IF EXISTS ljf_attachments_auth_read ON storage.objects;
CREATE POLICY ljf_attachments_auth_read
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'attachments'
    AND public.has_role(ARRAY['admin', 'editor', 'viewer']::public.app_role[])
  );
```

- CLI で適用していた場合は、`supabase migration repair --status reverted 20261008000000` で記録も戻す。
- 戻した後に 2章の SQL を再実行し、定義が事前確認で保存したものと一致することを確認する。

すぐ切り戻す症状：

- 有効な editor・admin が、管理画面から添付ファイルを開けなくなった（4.1 で editor が 0 件、かつバケットは空ではない）
- 戻さない（想定どおりの動作）：viewer が Storage から添付を読めない

### 6.2 スポンサー詳細 API を戻す

直前のバックエンドを再デプロイする（DB の変更は無い）。
