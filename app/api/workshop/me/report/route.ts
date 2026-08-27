import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateReport, readSavedReport } from "@/lib/report/generate.server";

/**
 * POST /api/workshop/me/report
 * レポートのAI分析文を生成して WorkshopData.post.report に保存する。
 * 保存済みがあればそれを返し、AIは叩かない（初回のみ生成。docs/REPORT_DESIGN.md §5）。
 * body の { force: true } で明示的に再生成する。
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "ログインしてください。" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const force = (body as { force?: unknown }).force === true;

  const wd = await prisma.workshopData.findUnique({
    where: { userId: session.sub },
    select: { pre: true, day1: true, homework: true, day2: true, post: true },
  });
  if (!wd) {
    return NextResponse.json({ error: "ワークの記録が見つかりません。" }, { status: 404 });
  }

  const saved = readSavedReport(wd.post);
  if (saved && !force) {
    return NextResponse.json({ report: saved, cached: true });
  }

  const report = await generateReport({
    pre: wd.pre,
    day1: wd.day1,
    homework: wd.homework,
    day2: wd.day2,
    post: wd.post,
  });

  // 生成できなかったとき（APIキー未設定／材料不足）は保存しない。
  // 空のレポートを保存すると、あとからワークを書き足しても初回の空が固定されてしまう。
  if (!report) {
    return NextResponse.json({ report: null, cached: false });
  }

  const currentPost =
    wd.post && typeof wd.post === "object" && !Array.isArray(wd.post)
      ? (wd.post as Record<string, unknown>)
      : {};

  await prisma.workshopData.update({
    where: { userId: session.sub },
    data: {
      post: { ...currentPost, report } as Prisma.InputJsonValue,
    },
  });

  return NextResponse.json({ report, cached: false });
}
