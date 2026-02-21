import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

const CATEGORY_KEYS = [
  "paid_work_hours",
  "home_work_hours",
  "care_hours",
  "study_hours",
  "leisure_hours",
  "other_hours",
] as const;

type AllocationRow = { A: number; B: number; C: number; D: number };

type Step2Body = {
  allocation?: Partial<Record<(typeof CATEGORY_KEYS)[number], Partial<AllocationRow>>>;
};

function normalizeRow(row: Partial<AllocationRow> | undefined): AllocationRow {
  const a = Math.max(0, Number(row?.A)) || 0;
  const b = Math.max(0, Number(row?.B)) || 0;
  const c = Math.max(0, Number(row?.C)) || 0;
  const d = Math.max(0, Number(row?.D)) || 0;
  const sum = a + b + c + d || 1;
  return {
    A: Math.round((a / sum) * 100),
    B: Math.round((b / sum) * 100),
    C: Math.round((c / sum) * 100),
    D: Math.round((d / sum) * 100),
  };
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "ログインしてください。" },
      { status: 401 }
    );
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

  const currentAlloc = (existing.step2 as Record<string, AllocationRow> | null)?.allocation ?? {};
  const allocation: Record<string, AllocationRow> = { ...currentAlloc };
  if (body.allocation && typeof body.allocation === "object") {
    for (const key of CATEGORY_KEYS) {
      const row = body.allocation[key];
      if (row && typeof row === "object") {
        allocation[key] = normalizeRow(row);
      }
    }
  }

  const step2 = { allocation };
  const completedBlocks = existing.completedBlocks.includes("block_2")
    ? existing.completedBlocks
    : [...existing.completedBlocks, "block_2"];

  await prisma.workshopData.update({
    where: { userId: session.sub },
    data: {
      step2: step2 as Prisma.InputJsonValue,
      completedBlocks,
    },
  });

  return NextResponse.json({ step2, completedBlocks });
}
