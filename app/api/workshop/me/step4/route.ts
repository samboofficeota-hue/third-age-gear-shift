import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

type Step4Body = {
  day1_comment?: string;
};

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "ログインしてください。" },
      { status: 401 }
    );
  }

  let body: Step4Body;
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

  const current = (existing.step4 as Record<string, unknown>) || {};
  const step4: Record<string, unknown> = { ...current };
  if (typeof body.day1_comment === "string") {
    step4.day1_comment = body.day1_comment;
  }

  const completedBlocks = existing.completedBlocks.includes("block_4")
    ? existing.completedBlocks
    : [...existing.completedBlocks, "block_4"];

  await prisma.workshopData.update({
    where: { userId: session.sub },
    data: {
      step4: step4 as Prisma.InputJsonValue,
      completedBlocks,
    },
  });

  return NextResponse.json({ step4, completedBlocks });
}
