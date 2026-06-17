/**
 * リハーサル用ダミーデータを投入する（冪等）。
 * 実行: npm run rehearsal:setup
 *
 * 作るもの:
 * - 研修セッション 1件（code=REHEARSAL, Day1/Day2 日程あり）
 * - 会社 2社（[リハ] プレフィックス）
 * - 講師 1名（role=facilitator）
 * - 参加者 5名（role=participant・会社/部署あり・セッションに紐付け・即ログイン可）
 *
 * すべて即ログイン可（パスワード = rehearsal）。リハ終了後は npm run rehearsal:teardown で完全削除。
 */
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  REHEARSAL_CODE,
  REHEARSAL_PASSWORD,
  REHEARSAL_ORGS,
  REHEARSAL_FACILITATOR,
  REHEARSAL_PARTICIPANTS,
} from "./rehearsalData";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const prisma = new PrismaClient();
const DAY = 24 * 60 * 60 * 1000;

async function main() {
  const now = Date.now();
  const passwordHash = await bcrypt.hash(REHEARSAL_PASSWORD, 10);

  // 会社（Organization は name に unique が無いので findFirst→create）
  const orgIds: string[] = [];
  for (const o of REHEARSAL_ORGS) {
    const existing = await prisma.organization.findFirst({ where: { name: o.name } });
    const org = existing ?? (await prisma.organization.create({ data: o }));
    orgIds.push(org.id);
  }

  // 研修セッション（Day1 = 2週間後 / Day2 = 3週間後）
  const session = await prisma.workshopSession.upsert({
    where: { code: REHEARSAL_CODE },
    update: {
      day1Date: new Date(now + 14 * DAY),
      day2Date: new Date(now + 21 * DAY),
      isActive: true,
    },
    create: {
      code: REHEARSAL_CODE,
      name: "リハーサル研修",
      day1Date: new Date(now + 14 * DAY),
      day2Date: new Date(now + 21 * DAY),
    },
  });

  // 講師
  await prisma.user.upsert({
    where: { email: REHEARSAL_FACILITATOR.email },
    update: { name: REHEARSAL_FACILITATOR.name, role: "facilitator", passwordHash, activatedAt: new Date() },
    create: {
      email: REHEARSAL_FACILITATOR.email,
      name: REHEARSAL_FACILITATOR.name,
      role: "facilitator",
      passwordHash,
      activatedAt: new Date(),
    },
  });

  // 参加者
  for (const p of REHEARSAL_PARTICIPANTS) {
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: {
        name: p.name,
        department: p.department || null,
        role: "participant",
        organizationId: orgIds[p.orgIndex],
        passwordHash,
        activatedAt: new Date(),
      },
      create: {
        email: p.email,
        name: p.name,
        department: p.department || null,
        role: "participant",
        organizationId: orgIds[p.orgIndex],
        passwordHash,
        activatedAt: new Date(),
      },
    });
    await prisma.workshopData.upsert({
      where: { userId: user.id },
      update: { sessionId: session.id },
      create: { userId: user.id, sessionId: session.id, completedPhases: [] },
    });
  }

  console.log("✅ リハーサル用データを投入しました。");
  console.log(`   研修コード: ${REHEARSAL_CODE} / 共通パスワード: ${REHEARSAL_PASSWORD}`);
  console.log(`   講師:   ${REHEARSAL_FACILITATOR.email}`);
  REHEARSAL_PARTICIPANTS.forEach((p) =>
    console.log(`   参加者: ${p.email}  (${p.name}${p.department ? " / " + p.department : ""})`)
  );
  console.log("   終了後は `npm run rehearsal:teardown` で完全削除してください。");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
