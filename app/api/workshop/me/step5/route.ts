import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

type Step5Body = {
  human_strengths?: string;
  human_growth?: string;
  human_score?: number;
  social_network?: string;
  social_community?: string;
  social_score?: number;
  financial_other_income?: boolean;
  financial_detail?: string;
};

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "ログインしてください。" }, { status: 401 });
  }

  let body: Step5Body;
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

  const current = (existing.step5 as Record<string, unknown>) || {};
  const step5: Record<string, unknown> = {
    ...current,
    capitals: {
      human: {
        strengths: body.human_strengths ?? (current.capitals as Record<string, Record<string, unknown>>)?.human?.strengths ?? "",
        growth: body.human_growth ?? (current.capitals as Record<string, Record<string, unknown>>)?.human?.growth ?? "",
        score: Math.min(5, Math.max(1, Number(body.human_score ?? (current.capitals as Record<string, Record<string, unknown>>)?.human?.score ?? 3))),
      },
      social: {
        network: body.social_network ?? (current.capitals as Record<string, Record<string, unknown>>)?.social?.network ?? "",
        community: body.social_community ?? (current.capitals as Record<string, Record<string, unknown>>)?.social?.community ?? "",
        score: Math.min(5, Math.max(1, Number(body.social_score ?? (current.capitals as Record<string, Record<string, unknown>>)?.social?.score ?? 3))),
      },
      financial: {
        other_income: body.financial_other_income ?? (current.capitals as Record<string, Record<string, unknown>>)?.financial?.other_income ?? false,
        detail: body.financial_detail ?? (current.capitals as Record<string, Record<string, unknown>>)?.financial?.detail ?? "",
      },
    },
  };

  const completedBlocks = existing.completedBlocks.includes("block_5")
    ? existing.completedBlocks
    : [...existing.completedBlocks, "block_5"];

  await prisma.workshopData.update({
    where: { userId: session.sub },
    data: { step5: step5 as Prisma.InputJsonValue, completedBlocks },
  });

  return NextResponse.json({ step5, completedBlocks });
}
