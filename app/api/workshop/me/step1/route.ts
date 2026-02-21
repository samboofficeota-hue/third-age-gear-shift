import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

type Step1Body = {
  paid_work_hours?: number;
  home_work_hours?: number;
  care_hours?: number;
  study_hours?: number;
  leisure_hours?: number;
  other_hours?: number;
  user_feeling_comment?: string;
};

function toNum(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return Math.max(0, v);
  if (typeof v === "string") return Math.max(0, parseFloat(v) || 0);
  return 0;
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "ログインしてください。" },
      { status: 401 }
    );
  }

  let body: Step1Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const existing = await prisma.workshopData.findUnique({
    where: { userId: session.sub },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "ワークショップデータが見つかりません。" },
      { status: 404 }
    );
  }

  const current = (existing.step1 as Record<string, unknown>) || {};
  const paid_work_hours = toNum(body.paid_work_hours ?? current.paid_work_hours);
  const home_work_hours = toNum(body.home_work_hours ?? current.home_work_hours);
  const care_hours = toNum(body.care_hours ?? current.care_hours);
  const study_hours = toNum(body.study_hours ?? current.study_hours);
  const leisure_hours = toNum(body.leisure_hours ?? current.leisure_hours);
  const other_hours = toNum(body.other_hours ?? current.other_hours);
  const total =
    paid_work_hours +
    home_work_hours +
    care_hours +
    study_hours +
    leisure_hours +
    other_hours;

  const step1: Record<string, unknown> = {
    ...current,
    paid_work_hours,
    home_work_hours,
    care_hours,
    study_hours,
    leisure_hours,
    other_hours,
    total,
  };
  if (typeof body.user_feeling_comment === "string") {
    step1.user_feeling_comment = body.user_feeling_comment;
  }

  const feelingComment = body.user_feeling_comment ?? (current.user_feeling_comment as string | undefined);
  const hasFeelingComment = typeof feelingComment === "string" && feelingComment.trim() !== "";
  const completedBlocks =
    existing.completedBlocks.includes("block_1") || hasFeelingComment
      ? existing.completedBlocks.includes("block_1")
        ? existing.completedBlocks
        : [...existing.completedBlocks, "block_1"]
      : existing.completedBlocks;

  await prisma.workshopData.update({
    where: { userId: session.sub },
    data: {
      step1: step1 as Prisma.InputJsonValue,
      completedBlocks,
    },
  });

  return NextResponse.json({ step1, completedBlocks });
}
