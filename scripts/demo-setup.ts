/**
 * デモ用（記入例の供給源）アカウント＋研修セッションを投入する（冪等）。
 * 実行: npm run demo:setup
 *
 * 目的:
 * - 「記入例」はハードコード定数ではなく、太田さんが実画面で入力した実データを
 *   Supabase から読む形にする。そのための安定アカウント（リハ teardown で消えない）。
 *
 * 作るもの:
 * - 研修セッション 1件（code=DEMO）
 * - 会社 1社（[デモ] プレフィックス）
 * - 参加者 1名: 太田 義史（y-ota@sambo-office.com / role=participant・即ログイン可）
 * - Day1〜Day2 を OPEN（太田さんが全シートに記入例を入力できるように）
 *
 * ※ リハーサル(REHEARSAL)とは別 namespace。teardown 対象外で常駐する。
 */
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const prisma = new PrismaClient();
const DAY = 24 * 60 * 60 * 1000;

const DEMO_CODE = "DEMO";
const DEMO_PASSWORD = "demo2026";
const DEMO_ORG = "[デモ] サンボ・オフィス";
const DEMO_USER = { email: "y-ota@sambo-office.com", name: "太田 義史" };
// 太田さんに記入例を入力してもらうため開放するフェーズ（pre は非ゲートで常時可）
const OPEN_PHASES = ["day1", "homework", "day2", "post"] as const;

async function main() {
  const now = Date.now();
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // 会社（name に unique 無し → findFirst→create）
  const existingOrg = await prisma.organization.findFirst({ where: { name: DEMO_ORG } });
  const org = existingOrg ?? (await prisma.organization.create({ data: { name: DEMO_ORG } }));

  // 研修セッション
  const session = await prisma.workshopSession.upsert({
    where: { code: DEMO_CODE },
    update: {
      day1Date: new Date(now + 14 * DAY),
      day2Date: new Date(now + 21 * DAY),
      isActive: true,
    },
    create: {
      code: DEMO_CODE,
      name: "デモ研修（記入例）",
      day1Date: new Date(now + 14 * DAY),
      day2Date: new Date(now + 21 * DAY),
    },
  });

  // 参加者（太田 義史）
  const user = await prisma.user.upsert({
    where: { email: DEMO_USER.email },
    update: {
      name: DEMO_USER.name,
      role: "participant",
      organizationId: org.id,
      passwordHash,
      activatedAt: new Date(),
    },
    create: {
      email: DEMO_USER.email,
      name: DEMO_USER.name,
      role: "participant",
      organizationId: org.id,
      passwordHash,
      activatedAt: new Date(),
    },
  });

  await prisma.workshopData.upsert({
    where: { userId: user.id },
    update: { sessionId: session.id },
    create: { userId: user.id, sessionId: session.id, completedPhases: [] },
  });

  // フェーズ開放（記入例入力のため）
  for (const blockId of OPEN_PHASES) {
    await prisma.blockStatus.upsert({
      where: { sessionId_blockId: { sessionId: session.id, blockId } },
      update: { status: "OPEN", openedAt: new Date() },
      create: { sessionId: session.id, blockId, status: "OPEN", openedAt: new Date() },
    });
  }

  console.log("✅ デモ用データを投入しました。");
  console.log(`   研修コード: ${DEMO_CODE}`);
  console.log(`   参加者:     ${DEMO_USER.email}  (${DEMO_USER.name})`);
  console.log(`   パスワード: ${DEMO_PASSWORD}`);
  console.log(`   開放フェーズ: pre(常時) / ${OPEN_PHASES.join(" / ")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
