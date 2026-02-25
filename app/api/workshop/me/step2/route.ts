import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

type WorkType = "A" | "B" | "C" | "D" | "E";
type Classification = { description: string; hours: number; workType: WorkType | null };
type Totals = { A: number; B: number; C: number; D: number; E: number };

type Step2Body = {
  classifications?: unknown[];
  totals?: unknown;
};

const VALID_WORK_TYPES: WorkType[] = ["A", "B", "C", "D", "E"];

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "ログインしてください。" }, { status: 401 });
  }

  let body: Step2Body;
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

  const classifications: Classification[] = (
    Array.isArray(body.classifications) ? body.classifications : []
  )
    .filter((c): c is Record<string, unknown> => typeof c === "object" && c !== null)
    .map((c) => ({
      description: String(c.description ?? "").trim().slice(0, 200),
      hours: Math.max(0, Math.min(500, Number(c.hours) || 0)),
      workType: VALID_WORK_TYPES.includes(c.workType as WorkType)
        ? (c.workType as WorkType)
        : null,
    }));

  // Recompute totals server-side for safety
  const totals: Totals = { A: 0, B: 0, C: 0, D: 0, E: 0 };
  for (const c of classifications) {
    if (c.workType) totals[c.workType] += c.hours;
  }

  const step2 = { classifications, totals };

  const isCompleted = classifications.length > 0 && classifications.some((c) => c.workType);
  const completedBlocks =
    isCompleted && !existing.completedBlocks.includes("block_2")
      ? [...existing.completedBlocks, "block_2"]
      : existing.completedBlocks;

  await prisma.workshopData.update({
    where: { userId: session.sub },
    data: {
      step2: step2 as Prisma.InputJsonValue,
      completedBlocks,
    },
  });

  return NextResponse.json({ step2, completedBlocks });
}
