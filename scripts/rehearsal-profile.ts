/**
 * リハーサル参加者に「じぶん紹介」のダミー回答を入れる（講師画面 F-2 の確認用）。
 * 実行: npx tsx scripts/rehearsal-profile.ts
 */
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const prisma = new PrismaClient();

const PROFILE = {
  name: "山田 太郎",
  nickname: "たろちゃん",
  points: [
    "20年つづけている草野球のキャッチャー",
    "妻と二人で日本百名山を制覇中（現在38座）",
    "後輩の相談に乗るのが好き。気づくと聞き役",
  ],
  history: [
    { year: "1978", event: "静岡県浜松市に生まれる" },
    { year: "2001", event: "あおぞら商事に入社、営業配属" },
    { year: "2010", event: "名古屋支店へ異動。初めて部下を持つ" },
    { year: "2018", event: "営業部 課長。数字より人が気になり始める" },
    { year: "2024", event: "役職定年まであと5年と気づく" },
  ],
  work: {
    company: "[リハ] あおぞら商事",
    dept: "営業部",
    title: "課長 / チームリーダー",
    q1: "食品包材の安定供給を通じて、地域の食を支える",
    q2: "中部エリアの既存顧客を守りつつ、新規開拓の種をまく",
    q3: "メンバーが安心して失敗できる場をつくること",
  },
};

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "p1@rehearsal.thirdage.test" },
    include: { workshopData: true },
  });
  if (!user?.workshopData) throw new Error("リハーサル参加者が見つかりません。先に npm run rehearsal:setup を実行してください。");

  const pre = (user.workshopData.pre as Record<string, unknown> | null) ?? {};
  await prisma.workshopData.update({
    where: { id: user.workshopData.id },
    data: { pre: { ...pre, profileSlide: PROFILE } },
  });

  console.log(`✅ ${user.email} に じぶん紹介 のダミーデータを入れました。`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
