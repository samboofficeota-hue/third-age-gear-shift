import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "ログインしてください。" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const code = typeof body.code === "string" ? body.code.trim() : "";

  if (!code) {
    return NextResponse.json({ error: "コードを入力してください。" }, { status: 400 });
  }

  const workshopSession = await prisma.workshopSession.findUnique({
    where: { code },
  });
  if (!workshopSession) {
    return NextResponse.json(
      { error: "コードが正しくありません。講師に確認してください。" },
      { status: 404 }
    );
  }
  if (!workshopSession.isActive) {
    return NextResponse.json(
      { error: "このコードは現在無効です。講師に確認してください。" },
      { status: 403 }
    );
  }

  // WorkshopData を upsert（存在しない場合は作成）して sessionId を設定
  await prisma.workshopData.upsert({
    where: { userId: session.sub },
    update: { sessionId: workshopSession.id },
    create: {
      userId: session.sub,
      sessionId: workshopSession.id,
      completedBlocks: [],
    },
  });

  return NextResponse.json({ sessionId: workshopSession.id, sessionName: workshopSession.name });
}
