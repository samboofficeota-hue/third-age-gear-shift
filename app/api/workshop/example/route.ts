import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

/**
 * 「記入例を見る」用のデータを返す。
 * 記入例はハードコードではなく、デモ用アカウント（太田さんが実画面で入力した実データ）を
 * 読み取り専用で返す。供給源は scripts/demo-setup.ts で作成した DEMO アカウント。
 */
const DEMO_EMAIL = "y-ota@sambo-office.com";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "ログインしてください。" }, { status: 401 });
  }

  const demo = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
    select: { id: true, name: true },
  });
  if (!demo) {
    return NextResponse.json({ example: null });
  }

  const wd = await prisma.workshopData.findUnique({
    where: { userId: demo.id },
    select: { pre: true, day1: true, homework: true },
  });

  return NextResponse.json({
    example: {
      name: demo.name,
      pre: wd?.pre ?? null,
      day1: wd?.day1 ?? null,
      homework: wd?.homework ?? null,
    },
  });
}
