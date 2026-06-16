import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { generateMicchiWelcome, MICCHI_WELCOME_FALLBACK } from "@/lib/ai";

/**
 * 事前課題の提出を受けて、ミッチーの歓迎メッセージを生成（1回だけ）。
 * 既に pre.aiWelcome があればそれを返す。生成失敗時はフォールバックを返し保存しない。
 */
export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "ログインしてください。" }, { status: 401 });
  }

  const wd = await prisma.workshopData.findUnique({
    where: { userId: session.sub },
  });
  const pre = (wd?.pre as Record<string, unknown> | null) ?? {};

  // 生成済みならそのまま返す（再生成しない）
  if (typeof pre.aiWelcome === "string" && pre.aiWelcome.trim()) {
    return NextResponse.json({ message: pre.aiWelcome });
  }

  const slide = (pre.profileSlide as Record<string, unknown> | undefined) ?? {};

  let message: string;
  let persist = true;
  try {
    message = await generateMicchiWelcome(slide);
  } catch {
    message = MICCHI_WELCOME_FALLBACK;
    persist = false; // 失敗は保存せず、次回リトライできるようにする
  }

  if (persist && wd) {
    await prisma.workshopData.update({
      where: { userId: session.sub },
      data: { pre: { ...pre, aiWelcome: message } as Prisma.InputJsonValue },
    });
  }

  return NextResponse.json({ message });
}
