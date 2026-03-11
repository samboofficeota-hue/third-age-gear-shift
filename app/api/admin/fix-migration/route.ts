import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// 一時的なエンドポイント：本番DBのマイグレーション修正用
// 使用後は削除してください
export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "管理者のみ実行できます。" }, { status: 403 });
  }

  const results: string[] = [];

  // 各ステップを独立して実行（エラーがあっても続行）
  const run = async (label: string, sql: string) => {
    try {
      await prisma.$executeRawUnsafe(sql);
      results.push(`✅ ${label}`);
    } catch (e: unknown) {
      results.push(`⚠️ ${label}: ${String(e).slice(0, 120)}`);
    }
  };

  // 1. code カラム追加
  await run("code カラム追加", `ALTER TABLE "workshop_sessions" ADD COLUMN IF NOT EXISTS "code" TEXT`);

  // 2. 既存行にコード付与
  await run("既存行へコード付与", `UPDATE "workshop_sessions" SET "code" = 'session-' || id WHERE "code" IS NULL`);

  // 3. NOT NULL 制約
  await run("code NOT NULL 制約", `ALTER TABLE "workshop_sessions" ALTER COLUMN "code" SET NOT NULL`);

  // 4. UNIQUE インデックス
  await run("UNIQUE インデックス", `CREATE UNIQUE INDEX IF NOT EXISTS "workshop_sessions_code_key" ON "workshop_sessions"("code")`);

  // 5. is_active カラム追加
  await run("is_active カラム追加", `ALTER TABLE "workshop_sessions" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true`);

  // 6. FK制約（データ不整合がある場合はスキップ）
  await run("workshop_data FK（不整合時はスキップ）", `
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'workshop_data_session_id_fkey'
      ) THEN
        -- 不整合データを先にNULL化してからFK追加
        UPDATE "workshop_data" SET "session_id" = NULL
        WHERE "session_id" IS NOT NULL
          AND "session_id" NOT IN (SELECT id FROM "workshop_sessions");
        ALTER TABLE "workshop_data"
          ADD CONSTRAINT "workshop_data_session_id_fkey"
          FOREIGN KEY ("session_id") REFERENCES "workshop_sessions"("id")
          ON DELETE SET NULL ON UPDATE CASCADE;
      END IF;
    END $$
  `);

  // 7. _prisma_migrations の失敗マークを「適用済み」に修正
  await run("_prisma_migrations 失敗マーク修正", `
    UPDATE "_prisma_migrations"
    SET finished_at = NOW(),
        rolled_back_at = NULL,
        logs = NULL
    WHERE migration_name = '20260311000000_add_session_code_active'
  `);

  const hasError = results.some((r) => r.startsWith("⚠️"));
  return NextResponse.json({ success: !hasError, results });
}
