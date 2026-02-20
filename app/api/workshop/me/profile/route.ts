import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

const COOKIE_NAME = "workshop_guest_id";

const AGE_GROUPS = ["40s", "50s", "60s"] as const;
const INITIAL_FEELINGS = [
  "不安",
  "期待",
  "面倒くさい",
  "ワクワク",
  "よくわからない",
] as const;

type ProfileBody = {
  name?: string;
  age_group?: (typeof AGE_GROUPS)[number];
  role?: string;
  years_of_service?: number;
  initial_feeling?: (typeof INITIAL_FEELINGS)[number][];
};

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const workshopDataId = cookieStore.get(COOKIE_NAME)?.value;
  if (!workshopDataId) {
    return NextResponse.json(
      { error: "No workshop session. Start from /workshop." },
      { status: 401 }
    );
  }

  let body: ProfileBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const existing = await prisma.workshopData.findUnique({
    where: { id: workshopDataId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Workshop session not found" }, { status: 404 });
  }

  const currentProfile = (existing.profile as Record<string, unknown>) || {};
  const profile: Record<string, unknown> = { ...currentProfile };
  if (typeof body.name === "string") profile.name = body.name;
  if (body.age_group && AGE_GROUPS.includes(body.age_group))
    profile.age_group = body.age_group;
  if (typeof body.role === "string") profile.role = body.role;
  if (typeof body.years_of_service === "number")
    profile.years_of_service = body.years_of_service;
  if (
    Array.isArray(body.initial_feeling) &&
    body.initial_feeling.every((f) => INITIAL_FEELINGS.includes(f))
  ) {
    profile.initial_feeling = body.initial_feeling;
  }

  const completedBlocks = existing.completedBlocks.includes("block_0")
    ? existing.completedBlocks
    : [...existing.completedBlocks, "block_0"];

  const updated = await prisma.workshopData.update({
    where: { id: workshopDataId },
    data: {
      profile: profile as Prisma.InputJsonValue,
      completedBlocks,
    },
  });

  return NextResponse.json({
    profile: updated.profile,
    completedBlocks: updated.completedBlocks,
  });
}
