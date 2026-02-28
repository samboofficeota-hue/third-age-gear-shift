import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

type Phase = {
  phase_number: 1 | 2 | 3;
  name: string;
  duration_months: number;
  increase_work: string[];
  decrease_work: string[];
  key_actions: string[];
  success_definition: string;
};

type Step7Body = {
  phases?: Phase[];
  first_step?: string;
};

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "ログインしてください。" }, { status: 401 });
  }

  let body: Step7Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const existing = await prisma.workshopData.findUnique({
    where: { userId: session.sub },
  });
  if (!existing) {
    return NextResponse.json({ error: "ワークショップデータが見つかりません。" }, { status: 404 });
  }

  const current = (existing.step7 as Record<string, unknown>) || {};
  const step7: Record<string, unknown> = { ...current };

  if (Array.isArray(body.phases)) {
    step7.phases = body.phases.map((p) => ({
      phase_number: p.phase_number,
      name: String(p.name || ""),
      duration_months: Math.min(60, Math.max(1, Number(p.duration_months) || 12)),
      increase_work: Array.isArray(p.increase_work) ? p.increase_work : [],
      decrease_work: Array.isArray(p.decrease_work) ? p.decrease_work : [],
      key_actions: Array.isArray(p.key_actions) ? p.key_actions.slice(0, 3) : [],
      success_definition: String(p.success_definition || ""),
    }));
  }

  if (typeof body.first_step === "string") {
    step7.first_step = body.first_step;
  }

  const completedBlocks = existing.completedBlocks.includes("block_7")
    ? existing.completedBlocks
    : [...existing.completedBlocks, "block_7"];

  await prisma.workshopData.update({
    where: { userId: session.sub },
    data: { step7: step7 as Prisma.InputJsonValue, completedBlocks },
  });

  return NextResponse.json({ step7, completedBlocks });
}
