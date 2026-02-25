import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "ログインしてください。" }, { status: 401 });
  }
  if (session.role !== "admin" && session.role !== "facilitator") {
    return NextResponse.json({ error: "権限がありません。" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  const users = await prisma.user.findMany({
    where: {
      role: "participant",
      ...(sessionId
        ? { workshopData: { sessionId } }
        : {}),
    },
    include: {
      workshopData: {
        select: {
          completedBlocks: true,
          lastUpdated: true,
          profile: true,
          sessionId: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    participants: users.map((u) => {
      const profile = u.workshopData?.profile as Record<string, unknown> | null;
      return {
        id: u.id,
        email: u.email,
        name: (profile?.name as string) ?? null,
        completedBlocks: u.workshopData?.completedBlocks ?? [],
        lastUpdated: u.workshopData?.lastUpdated ?? null,
      };
    }),
  });
}
