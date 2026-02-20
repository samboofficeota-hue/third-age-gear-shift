import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

const COOKIE_NAME = "workshop_guest_id";

export async function GET() {
  const cookieStore = await cookies();
  const workshopDataId = cookieStore.get(COOKIE_NAME)?.value;
  if (!workshopDataId) {
    return NextResponse.json({ workshopData: null }, { status: 200 });
  }

  const workshopData = await prisma.workshopData.findUnique({
    where: { id: workshopDataId },
    include: { user: { select: { id: true, email: true, role: true } } },
  });

  if (!workshopData) {
    return NextResponse.json({ workshopData: null }, { status: 200 });
  }

  const profile = workshopData.profile as Record<string, unknown> | null;
  return NextResponse.json({
    workshopData: {
      id: workshopData.id,
      profile,
      completedBlocks: workshopData.completedBlocks,
      lastUpdated: workshopData.lastUpdated,
    },
  });
}
