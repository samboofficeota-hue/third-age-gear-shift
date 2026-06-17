/**
 * リハーサル用ダミーデータを完全削除する。
 * 実行: npm run rehearsal:teardown
 *
 * namespace（メールドメイン / コード / 会社名プレフィックス）に一致するものだけを消す。
 * 削除順: 参加者・講師ユーザー（→ WorkshopData / overrides を Cascade）
 *        → 研修セッション（→ BlockStatus を Cascade） → 会社。
 * 実データ（@rehearsal.thirdage.test 以外）は対象外。
 */
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import {
  REHEARSAL_DOMAIN,
  REHEARSAL_CODE,
  REHEARSAL_ORG_PREFIX,
} from "./rehearsalData";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const prisma = new PrismaClient();

async function main() {
  // 1) ユーザー（@rehearsal... のメール）→ WorkshopData / ParticipantBlockOverride は onDelete: Cascade
  const users = await prisma.user.deleteMany({
    where: { email: { endsWith: `@${REHEARSAL_DOMAIN}` } },
  });

  // 2) 研修セッション（code=REHEARSAL）→ BlockStatus は onDelete: Cascade
  const sessions = await prisma.workshopSession.deleteMany({
    where: { code: REHEARSAL_CODE },
  });

  // 3) 会社（[リハ] プレフィックス）。参加者削除後なので参照は残っていない。
  const orgs = await prisma.organization.deleteMany({
    where: { name: { startsWith: REHEARSAL_ORG_PREFIX } },
  });

  console.log("🧹 リハーサル用データを削除しました。");
  console.log(`   ユーザー: ${users.count} / セッション: ${sessions.count} / 会社: ${orgs.count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
