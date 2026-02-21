import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

type Step3Body = {
  future_D?: number;
  future_C?: number;
  future_B?: number;
  future_A?: number;
  will_do?: string;
  will_quit?: string;
};

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "ログインしてください。" },
      { status: 401 }
    );
  }

  let body: Step3Body;
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

  const current = (existing.step3 as Record<string, unknown>) || {};
  let future_D = clamp(
    Number(body.future_D ?? current.future_D ?? 0),
    0,
    50
  );
  let future_C = clamp(
    Number(body.future_C ?? current.future_C ?? 0),
    0,
    40
  );
  let future_B = clamp(
    Number(body.future_B ?? current.future_B ?? 0),
    0,
    40
  );
  let future_A = 100 - future_D - future_C - future_B;
  future_A = clamp(future_A, 0, 100);
  // 再正規化して100%に
  const sum = future_D + future_C + future_B + future_A;
  if (sum !== 100) {
    future_D = Math.round((future_D / sum) * 100);
    future_C = Math.round((future_C / sum) * 100);
    future_B = Math.round((future_B / sum) * 100);
    future_A = 100 - future_D - future_C - future_B;
  }

  const step3: Record<string, unknown> = {
    ...current,
    future_D,
    future_C,
    future_B,
    future_A,
  };
  if (typeof body.will_do === "string") step3.will_do = body.will_do;
  if (typeof body.will_quit === "string") step3.will_quit = body.will_quit;

  const completedBlocks = existing.completedBlocks.includes("block_3")
    ? existing.completedBlocks
    : [...existing.completedBlocks, "block_3"];

  await prisma.workshopData.update({
    where: { userId: session.sub },
    data: {
      step3: step3 as Prisma.InputJsonValue,
      completedBlocks,
    },
  });

  return NextResponse.json({ step3, completedBlocks });
}
