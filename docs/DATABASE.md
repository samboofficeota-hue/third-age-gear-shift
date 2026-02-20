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

## Railway

1. プロジェクトに **PostgreSQL** を追加する（Railway ダッシュボード → New → Database → PostgreSQL）。
2. アプリサービスに `DATABASE_URL` が自動で渡る（Variables に表示される）。
3. デプロイ時にマイグレーションを実行する場合、**Build Command** を次のどちらかにする:
   - `prisma generate && next build`（現状の `npm run build` のまま）
   - デプロイ後はじめに 1 回だけ、Railway の **Shell** で:
     ```bash
     npx prisma migrate deploy
     ```
     を実行する。

## テーブル概要

| テーブル | 用途 |
|----------|------|
| users | 認証（email / passwordHash / role） |
| workshop_data | 受講生のプロフィール・STEP1〜7・ミッチー対話履歴 |
| workshop_sessions | 研修セッション（block_status の親） |
| block_status | ブロック開示状態（LOCKED / OPEN 等） |
| participant_block_override | 個別受講生のブロック先行開放 |

詳細は `prisma/schema.prisma` を参照。
