-- 権限を2層（admin / participant）にする
--
-- ⚠️ 手書き。`prisma migrate diff` の自動生成は使わないこと。
--    同じSupabaseプロジェクトに別アプリのテーブルが同居しており、
--    自動生成SQLはそれらを DROP しようとする（docs/DATABASE.md 参照）。
--
-- 適用前の実データ：facilitator / coordinator のユーザーは0件、
-- facilitator_id が入った研修も0件。よって値の移行は不要。
-- 念のため、万一残っていた場合に備えて admin に寄せてから型を差し替える。

-- 1) 想定外の残存データを admin に寄せる（0件のはずだが安全側に倒す）
UPDATE "users" SET "role" = 'admin' WHERE "role" IN ('facilitator', 'coordinator');

-- 2) 担当講師の紐付けを削除（2層では全管理者が全研修を見るため不要）
ALTER TABLE "workshop_sessions" DROP CONSTRAINT IF EXISTS "workshop_sessions_facilitator_id_fkey";
ALTER TABLE "workshop_sessions" DROP COLUMN IF EXISTS "facilitator_id";

-- 3) enum を作り直す（Postgres は enum から値を削除できないため）
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
CREATE TYPE "UserRole" AS ENUM ('admin', 'participant');
ALTER TABLE "users"
  ALTER COLUMN "role" DROP DEFAULT,
  ALTER COLUMN "role" TYPE "UserRole" USING ("role"::text::"UserRole"),
  ALTER COLUMN "role" SET DEFAULT 'participant';
DROP TYPE "UserRole_old";
