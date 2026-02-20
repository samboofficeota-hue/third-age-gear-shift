# データベース設定

## ローカル開発

1. PostgreSQL を起動し、`.env.local` の `DATABASE_URL` を設定する。
2. スキーマを反映する:
   ```bash
   npx prisma db push
   ```
   またはマイグレーションを使う:
   ```bash
   npx prisma migrate dev --name init
   ```
3. （任意）Prisma Studio でデータ確認:
   ```bash
   npm run db:studio
   ```

## Railway で PostgreSQL を追加してマイグレーションする（詳細手順）

### 前提

- Railway に **third-age-gear-shift** のプロジェクトがあり、Git 連携で Next.js アプリがデプロイされていること。
- まだ PostgreSQL を追加していない状態から始める。

---

### ステップ 1：PostgreSQL をプロジェクトに追加する

1. [Railway ダッシュボード](https://railway.app/dashboard) を開き、**third-age-gear-shift** のプロジェクトを開く。
2. プロジェクト内の何もないところ、または「**+ New**」ボタンをクリックする。
3. メニューから **「Database」** を選ぶ。
4. データベースの種類で **「PostgreSQL」** を選んで追加する。
5. しばらくすると、一覧に **PostgreSQL** 用のサービス（カード）が表示される。緑色の「Deployed」などになれば準備完了。

---

### ステップ 2：アプリに DATABASE_URL を渡す（変数の参照）

1. **Next.js アプリのサービス（Web サービス側のカード）** をクリックして開く。
2. 上部タブから **「Variables」** を開く。
3. PostgreSQL を追加しただけでは、まだ **DATABASE_URL は表示されていない** ことがある。その場合は **「+ New Variable」** や **「Add Reference」** のようなボタンを探す。
4. **「Add Reference」**（または「Variable Reference」）を選び、**PostgreSQL のサービス** を選ぶ。
5. 参照する変数として **`DATABASE_URL`** を選ぶ（PostgreSQL テンプレートでは通常これが 1 つある）。
6. 変数名はそのまま **`DATABASE_URL`** にして保存する。  
   → これで「アプリの環境変数 DATABASE_URL = PostgreSQL の接続文字列」になる。
7. **「Redeploy」** または次回のデプロイで、アプリはこの `DATABASE_URL` を読み込む。

**補足:** 最近の Railway では、PostgreSQL を同じプロジェクトに追加すると「**Connect**」や「**Variables**」から自動で `DATABASE_URL` を参照できる場合もある。その場合は「Add Reference」で PostgreSQL の `DATABASE_URL` を選べばよい。

---

### ステップ 3：一度デプロイする

1. 上記で `DATABASE_URL` を設定したあと、**デプロイが走る**（自動で走るか、手動で「Deploy」するかは設定による）。
2. デプロイが **成功して完了** するのを待つ。  
   → この時点では DB にテーブルはまだないので、アプリが DB に接続してテーブルを読もうとするとエラーになる可能性がある。  
   → 次のステップ 4 でマイグレーションを実行するとテーブルが作られる。

---

### ステップ 4：マイグレーションを 1 回だけ実行する

Railway の Web ダッシュボードには **Shell / Console タブがない** ことが多いです。その場合は **Railway CLI** でデプロイ中のコンテナに入り、その中でコマンドを実行します。

#### 方法 A：Railway CLI でコンテナに入って実行（推奨）

1. **Railway CLI をインストール**（未導入の場合）:
   ```bash
   npm install -g @railway/cli
   ```
   または Mac の場合:
   ```bash
   brew install railway
   ```

2. **ログイン**:
   ```bash
   railway login
   ```
   ブラウザが開くので、Railway アカウントで認証する。

3. **プロジェクトのルートで、サービスを紐づける**:
   ```bash
   cd /Users/Yoshi/third-age-gear-shift   # リポジトリのルート
   railway link
   ```
   表示される一覧から **プロジェクト** を選び、次に **third-age-gear-shift（Web アプリのサービス）** を選ぶ。Postgres ではなく、アプリ側を選ぶ。

4. **コンテナに入る**:
   ```bash
   railway ssh
   ```
   接続されると、コンテナ内のシェル（`$` や `#` のプロンプト）が出る。

5. **コンテナ内でマイグレーションを実行**:
   ```bash
   npx prisma migrate deploy
   ```

6. 成功したら **exit** で抜ける:
   ```bash
   exit
   ```

成功すると、次のようなメッセージが出ます:

```
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "..."
Applying migration `20260220120000_init`
The following migration(s) have been applied:
migrations/
  └─ 20260220120000_init/
    └─ migration.sql
All migrations have been successfully applied.
```

これで **PostgreSQL にテーブル（users, workshop_data, block_status など）が作成された** 状態になります。

#### 方法 B：ダッシュボードに Shell がある場合

サービス画面に **「Shell」** や **「Console」** タブがある場合は、そこを開き、同じように `npx prisma migrate deploy` を 1 回実行すればよいです。

---

### ステップ 5：動作確認

1. アプリの **URL（Railway が発行した xxx.up.railway.app）** にブラウザでアクセスする。
2. トップから「オンボーディングを始める」→ Block 0 でプロフィールを入力し、「保存して次へ」を押す。
3. 「研修の進め方」画面に進めば、API は成功している（DB に保存されている）。

**DB に本当に保存されているか確認する場合（Railway）：**

1. Railway ダッシュボードで **PostgreSQL サービス** を開く。
2. **「Database」→「Data」** でテーブル一覧を開く。
3. **`workshop_data`** テーブルを開く。
4. 1 行以上あれば、各レコードの **`profile`** 列（JSON）に、名前・年齢・職種・今の気持ちなどが入っている。  
   （1 件目は「オンボーディングを始める」で参加したときのゲスト用レコード。）
5. **`users`** テーブルには、同じ数だけ `guest_xxx@temp.third-age.local` のようなゲスト用ユーザーが作成されている。

---

### よくあること

| 状況 | 対処 |
|------|------|
| Shell がプロジェクト内にない | Railway のサービス設定で「Shell」や「Console」が有効か確認する。別サービス（PostgreSQL 側）ではなく **Web アプリ側** の Shell を使う。 |
| `DATABASE_URL` が undefined | アプリの Variables で PostgreSQL の `DATABASE_URL` を「参照」として追加し、Redeploy する。 |
| `prisma migrate deploy` で「No migration found」 | リポジトリに `prisma/migrations` が含まれているか確認。含まれていれば、そのコミットがデプロイされているか確認。 |
| 既にテーブルがある状態で再度 deploy したい | `npx prisma migrate deploy` は「まだ適用していないマイグレーション」だけを実行する。既に適用済みなら「No pending migrations」と出て正常。 |

## テーブル概要

| テーブル | 用途 |
|----------|------|
| users | 認証（email / passwordHash / role） |
| workshop_data | 受講生のプロフィール・STEP1〜7・ミッチー対話履歴 |
| workshop_sessions | 研修セッション（block_status の親） |
| block_status | ブロック開示状態（LOCKED / OPEN 等） |
| participant_block_override | 個別受講生のブロック先行開放 |

詳細は `prisma/schema.prisma` を参照。
