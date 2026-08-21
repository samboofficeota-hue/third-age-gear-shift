/**
 * リハーサル用の事務局アカウントを追加し、リハーサルセッションに講師・会場を設定する。
 * namespace は rehearsal-teardown の削除対象と同じ（@rehearsal.thirdage.test）。
 * 実行: npx tsx scripts/rehearsal-admin.ts
 */
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { REHEARSAL_CODE, REHEARSAL_PASSWORD } from "./rehearsalData";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash(REHEARSAL_PASSWORD, 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@rehearsal.thirdage.test" },
    update: { passwordHash, role: "admin" },
    create: {
      email: "admin@rehearsal.thirdage.test",
      name: "[リハ] 事務局",
      passwordHash,
      role: "admin",
      activatedAt: new Date(),
    },
  });

  const session = await prisma.workshopSession.update({
    where: { code: REHEARSAL_CODE },
    data: {
      location: "[リハ] 銀座THビル 9F",
      isOnline: false,
    },
  });

  console.log(`✅ 事務局: ${admin.email} / PW: ${REHEARSAL_PASSWORD}`);
  console.log(`   会場: ${session.location}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
