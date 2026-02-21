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
     npm run db:seed:railway
     ```
     または `railway run npm run db:seed`  
     **SEED_EMAIL / SEED_PASSWORD / SEED_ROLE** は Railway の Variables のほか、**.env.local に書いてもよい**（`npm run db:seed:railway` 実行時に読み込まれる）。

#### Cursor から Railway CLI で進める

Cursor のターミナルで次を順に実行する。

- **CLI 確認**  
  `railway --version` で未インストールなら `npm install -g @railway/cli` で導入。

- **ログイン**（ブラウザが開く）

  ```bash
  railway login
  ```

- **プロジェクトをリンク**（一覧から本番用を選択）

  ```bash
  railway link
  ```

  リンクしていないと `railway run` で本番の `DATABASE_URL` が渡らず、シードがローカルの `.env.local` の DB を参照して失敗する。必ず先にリンクすること。

- **Variables 設定**  
  Railway ダッシュボードの **Variables** で `SEED_EMAIL` / `SEED_PASSWORD` / `SEED_ROLE=admin` を追加（手順 1–2 のとおり）。

- **シード実行**

  ```bash
  npm run db:seed:railway
  ```

  成功時は `Created user: ... role: admin` と表示される。

上記シード成功後:

1. ログが `Created user: ... role: admin` と出れば成功。本番の `/login` でそのメール・パスワードでログインできる。
2. 必要なら Variables の `SEED_*` は削除してよい（既存ユーザーは消えません）。

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
