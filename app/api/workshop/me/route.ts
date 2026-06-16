import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

/**
 * ログイン中のユーザーの WorkshopData を返す。なければ 1 件作成する。
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "ログインしてください。" },
      { status: 401 }
    );
  }

  // 事前登録の氏名・所属会社（ワークシートの初期表示に使う）も取得する。
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { id: true, name: true, organization: { select: { name: true } } },
  });
  if (!user) {
    return NextResponse.json({ error: "ログインしてください。" }, { status: 401 });
  }

  let workshopData = await prisma.workshopData.findUnique({
    where: { userId: session.sub },
  });

  if (!workshopData) {
    workshopData = await prisma.workshopData.create({
      data: {
        userId: session.sub,
        completedPhases: [],
      },
    });
  }

  return NextResponse.json({
    account: {
      name: user.name,
      organizationName: user.organization?.name ?? null,
    },
    workshopData: {
      id: workshopData.id,
      sessionId: workshopData.sessionId,
      profile: workshopData.profile,
      pre: workshopData.pre,
      day1: workshopData.day1,
      homework: workshopData.homework,
      day2: workshopData.day2,
      post: workshopData.post,
      completedPhases: workshopData.completedPhases,
      lastUpdated: workshopData.lastUpdated,
    },
  });
}
