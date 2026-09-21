-- 研修セットごとのコンテンツ差し替え設定を workshop_sessions に追加
-- 既定は "default"（現行の標準構成）。既存の研修セットはすべて default になる。
ALTER TABLE "workshop_sessions"
  ADD COLUMN IF NOT EXISTS "content_set_id" TEXT NOT NULL DEFAULT 'default';
