# 認証

## 概要

- **ログイン:** メールアドレス + パスワード（研修事務局が事前発行する想定）
- **セッション:** JWT を httpOnly Cookie（`third_age_session`）で保持、有効 14 日
- **ロール:** `admin` | `facilitator` | `participant`（JWT の payload に含む）

## 初回ユーザーの作成（シード）

ログイン可能なユーザーは、**シードスクリプト**で 1 件以上作成する。

### ローカル

```bash
# デフォルト: participant@example.third-age.local / password123 / participant
npm run db:seed

# または環境変数で指定
SEED_EMAIL="admin@example.com" SEED_PASSWORD="your-secret" SEED_ROLE="admin" npm run db:seed
```

### Railway（本番）

本番の管理画面で使うユーザーは、Railway 上でシードを 1 回実行して作成する。

#### 手順

1. **Railway ダッシュボード**で、該当プロジェクト → **Variables** を開く。
2. 次の 3 つを追加（値は任意。本番用は強めのパスワード推奨）:
   - `SEED_EMAIL` = ログイン用メール（例: `admin@example.com`）
   - `SEED_PASSWORD` = ログイン用パスワード
   - `SEED_ROLE` = `admin`（管理画面用）または `facilitator` / `participant`
3. **シードを実行**（どちらか一方）:
   - **Railway の Shell**: ダッシュボードの **Shell** を開き、プロジェクト内で:
     ```bash
     npm run db:seed
     ```
   - **ローカルから Railway CLI**: プロジェクトで `railway link` 済みなら:
     ```bash
     railway run npm run db:seed
     ```
4. ログが `Created user: ... role: admin` と出れば成功。本番の `/login` でそのメール・パスワードでログインできる。
5. 必要なら Variables の `SEED_*` は削除してよい（既存ユーザーは消えません）。

**注意:** 同じメールのユーザーが既にいるときは「User already exists」と表示され、新規作成はスキップされる。

## 環境変数

| 変数 | 説明 |
|------|------|
| `JWT_SECRET` | JWT 署名用。**32 文字以上**のランダム文字列を推奨。 |
| `JWT_COOKIE_NAME` | Cookie 名（省略時: `third_age_session`） |

## ルート保護

- **/workshop/\*** … ログイン必須。未ログインは `/login?from=...` にリダイレクト。
- **/admin/\*** … `admin` または `facilitator` のみ。それ以外は `/` へ。
- **/login** … 認証不要。

## API

| エンドポイント | 説明 |
|----------------|------|
| `POST /api/auth/login` | body: `{ email, password }`。成功時は Cookie をセット。 |
| `POST /api/auth/logout` | Cookie を削除。 |
| `GET /api/auth/me` | 現在のユーザー（Cookie から）。未ログインは `{ user: null }`。 |
