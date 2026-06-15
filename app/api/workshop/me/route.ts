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

  let workshopData = await prisma.workshopData.findUnique({
    where: { userId: session.sub },
  });

  if (!workshopData) {
    // ユーザーが実際に存在するか確認（JWT が古い場合に FK エラーを防ぐ）
    const userExists = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { id: true },
    });
    if (!userExists) {
      return NextResponse.json({ error: "ログインしてください。" }, { status: 401 });
    }
    workshopData = await prisma.workshopData.create({
      data: {
        userId: session.sub,
        completedPhases: [],
      },
    });
  }

  return NextResponse.json({
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
