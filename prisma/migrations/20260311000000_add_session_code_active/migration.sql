-- workshop_sessions に code と is_active を追加
-- (初期マイグレーションから欠落していたカラム)

-- 1. code カラム追加 (まず NULL 許可で追加)
ALTER TABLE "workshop_sessions" ADD COLUMN IF NOT EXISTS "code" TEXT;

-- 既存行がある場合に一時的なコードを付与
UPDATE "workshop_sessions" SET "code" = 'session-' || id WHERE "code" IS NULL;

-- NOT NULL 制約を付与
ALTER TABLE "workshop_sessions" ALTER COLUMN "code" SET NOT NULL;

-- UNIQUE インデックス作成
CREATE UNIQUE INDEX IF NOT EXISTS "workshop_sessions_code_key" ON "workshop_sessions"("code");

-- 2. is_active カラム追加
ALTER TABLE "workshop_sessions" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;

-- 3. workshop_data の session_id FK（欠落していた場合のみ追加）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'workshop_data_session_id_fkey'
  ) THEN
    ALTER TABLE "workshop_data"
      ADD CONSTRAINT "workshop_data_session_id_fkey"
      FOREIGN KEY ("session_id") REFERENCES "workshop_sessions"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
