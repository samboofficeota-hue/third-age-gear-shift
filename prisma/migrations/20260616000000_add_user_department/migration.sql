-- 部署名（事前登録）を users に追加
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "department" TEXT;
