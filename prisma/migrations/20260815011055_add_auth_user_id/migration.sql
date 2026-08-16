-- Supabase Auth (auth.users.id) との紐付け。マジックリンクログイン移行用。
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "auth_user_id" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "users_auth_user_id_key" ON "users"("auth_user_id");
