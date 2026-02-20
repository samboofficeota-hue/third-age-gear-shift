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

1. アプリの **Variables** に一時的に追加（実行後削除してよい）:
   - `SEED_EMAIL` = ログイン用メール
   - `SEED_PASSWORD` = パスワード
   - `SEED_ROLE` = `participant` | `facilitator` | `admin`
2. **Shell（Railway CLI で `railway ssh`）** に入り、1 回だけ実行:
   ```bash
   npm run db:seed
   ```
3. 変数は残しておいてもよいが、本番用パスワードは強くすること。

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
