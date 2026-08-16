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

## アカウント作成と回答データの紐付け

参加者アカウントの作成には **2つの経路**がある。どちらでも、回答データ（`WorkshopData`）は
**ログイン中のユーザーID（`WorkshopData.userId` はユニークFK）** に紐づく。
全シートの保存は `patchPhaseData()`（`lib/workshopData.ts`）が `getSession().sub`（=userId）で
該当行を引く/作るため、**ログインした本人のIDに必ず回答が載る**。

### 経路A：招待 → アクティベーション（招待制の正道・推奨）

1. 事務局が参加者を事前登録（`name` / `department` / `organizationId` / `inviteToken` 付き、`passwordHash` は null）。
2. 参加者が招待リンク `/welcome?token=...` からパスワードを設定（`POST /api/auth/activate`）。
   - **同じ `user.id` を引き継ぐ**ため、氏名・部署・企業が保持される。
3. セッション発行 → 以降の回答はこの本人IDに紐づく。

### 経路B：自己登録 → 研修コード参加

1. `/register`（`POST /api/auth/register`）で email＋パスワードのみの**新規User**を作成（氏名・部署・セッションなし）。
2. `/workshop/join`（`POST /api/workshop/join`）で研修コードを入力 → `WorkshopData.sessionId` にセッションを紐付け。
3. 氏名等は事前アンケート/プロフィールで `WorkshopData.profile` に記録。

### ⚠️ 運用ルール（データが割れないために）

**同一人物を経路Aと経路Bの両方に載せない。** 参加者ごとに「招待でアクティベーション」**か**
「自己登録＋コード参加」の**どちらか一方**に統一する。

- 招待済みメールで自己登録 → `409`（既に登録済み）で失敗。
- 別メールで自己登録 → **別アカウント**となり回答が2つに割れる。

### パスワード忘れ

認証は独自方式（Prisma `User` + bcrypt + jose JWT）で **Supabase Auth は未使用**（Supabaseはストレージのみ）。
そのため Supabase の自動リセット（`resetPasswordForEmail`）は使えない。

- **現行の対応 = 事務局対応（運用ベース）**：ログイン画面に
  「パスワードをお忘れの方は、事務局までご連絡ください。」を表示し、事務局が招待トークン再発行等で対応。
- セルフ復旧（本人がメールのリンクから再設定）を導入する場合は、`resetToken` 追加＋
  メール送信基盤（Resend 等）＋リセットAPI/画面が別途必要（未実装）。

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
| `POST /api/auth/register` | 経路B。body: `{ email, password }`。新規Userを作成しCookieをセット。 |
| `POST /api/auth/activate` | 経路A。body: `{ token, email, password }`。招待トークンで既存Userを有効化。 |
| `POST /api/workshop/join` | 研修コードで `WorkshopData.sessionId` を紐付け。 |
