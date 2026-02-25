import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

type Activity = { description: string; hours: number };
type Step1Body = { activities?: unknown[] };

function toNum(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return Math.max(0, Math.min(500, v));
  if (typeof v === "string") return Math.max(0, Math.min(500, parseFloat(v) || 0));
  return 0;
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "ログインしてください。" }, { status: 401 });
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

  const activities: Activity[] = (Array.isArray(body.activities) ? body.activities : [])
    .filter((a): a is Record<string, unknown> => typeof a === "object" && a !== null)
    .map((a) => ({
      description: String(a.description ?? "").trim().slice(0, 200),
      hours: toNum(a.hours),
    }))
    .filter((a) => a.description || a.hours > 0);

  const total = activities.reduce((sum, a) => sum + a.hours, 0);
  const step1: Record<string, unknown> = { activities, total };

  const isCompleted = activities.length > 0 && total > 0;
  const completedBlocks =
    isCompleted && !existing.completedBlocks.includes("block_1")
      ? [...existing.completedBlocks, "block_1"]
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
