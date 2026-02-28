import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

type Step6Body = {
  will?: string;
  must?: string;
  can?: string;
  loop_description?: string;
  ideal_loop?: string;
};

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "ログインしてください。" }, { status: 401 });
  }

  let body: Step6Body;
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

  const current = (existing.step6 as Record<string, unknown>) || {};
  const step6: Record<string, unknown> = {
    ...current,
    ...(typeof body.will === "string" ? { will: body.will } : {}),
    ...(typeof body.must === "string" ? { must: body.must } : {}),
    ...(typeof body.can === "string" ? { can: body.can } : {}),
    ...(typeof body.loop_description === "string" ? { loop_description: body.loop_description } : {}),
    ...(typeof body.ideal_loop === "string" ? { ideal_loop: body.ideal_loop } : {}),
  };

  const completedBlocks = existing.completedBlocks.includes("block_6")
    ? existing.completedBlocks
    : [...existing.completedBlocks, "block_6"];

  await prisma.workshopData.update({
    where: { userId: session.sub },
    data: { step6: step6 as Prisma.InputJsonValue, completedBlocks },
  });

  return NextResponse.json({ step6, completedBlocks });
}
