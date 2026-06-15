import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getAllPhaseStatuses } from "@/lib/phases";

/**
 * ログイン中ユーザーの各フェーズ開放状態を返す（クライアントのゲーティング/ダッシュボード用）。
 * { sessionId, phases: { pre:'OPEN', day1:'LOCKED', ... } }
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "ログインしてください。" }, { status: 401 });
  }

  const wd = await prisma.workshopData.findUnique({
    where: { userId: session.sub },
    select: { sessionId: true },
  });

  const phases = await getAllPhaseStatuses(wd?.sessionId);
  return NextResponse.json({ sessionId: wd?.sessionId ?? null, phases });
}
