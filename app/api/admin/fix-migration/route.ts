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

  try {
    // 1. code カラム追加（NULL許可で追加）
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "workshop_sessions" ADD COLUMN IF NOT EXISTS "code" TEXT`
    );
    results.push("✅ code カラム追加（または既存）");

    // 2. 既存行にコードを付与
    const updated = await prisma.$executeRawUnsafe(
      `UPDATE "workshop_sessions" SET "code" = 'session-' || id WHERE "code" IS NULL`
    );
    results.push(`✅ 既存行へコード付与: ${updated} 件`);

    // 3. NOT NULL 制約
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "workshop_sessions" ALTER COLUMN "code" SET NOT NULL`
    );
    results.push("✅ code NOT NULL 制約設定");

    // 4. UNIQUE インデックス
    await prisma.$executeRawUnsafe(
      `CREATE UNIQUE INDEX IF NOT EXISTS "workshop_sessions_code_key" ON "workshop_sessions"("code")`
    );
    results.push("✅ UNIQUE インデックス作成（または既存）");

    // 5. is_active カラム追加
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "workshop_sessions" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true`
    );
    results.push("✅ is_active カラム追加（または既存）");

    // 6. workshop_data の session_id FK 追加（なければ）
    await prisma.$executeRawUnsafe(`
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
      END $$
    `);
    results.push("✅ workshop_data FK 追加（または既存）");

    // 7. _prisma_migrations の失敗済みマークを「適用済み」に修正
    await prisma.$executeRawUnsafe(`
      UPDATE "_prisma_migrations"
      SET finished_at = NOW(),
          rolled_back_at = NULL,
          logs = NULL
      WHERE migration_name = '20260311000000_add_session_code_active'
        AND finished_at IS NULL
    `);
    results.push("✅ _prisma_migrations の失敗マーク修正");

    return NextResponse.json({ success: true, results });
  } catch (e) {
    console.error("fix-migration error:", e);
    return NextResponse.json(
      { success: false, error: String(e), results },
      { status: 500 }
    );
  }
}
