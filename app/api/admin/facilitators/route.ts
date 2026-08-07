import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/adminAuth";

/** 担当講師の割り当て（S-5 / T-4）用。講師アカウントの一覧を返す。 */
export async function GET() {
  const guard = await requireStaff();
  if (!guard.ok) return guard.response;

  const facilitators = await prisma.user.findMany({
    where: { role: "facilitator" },
    select: { id: true, name: true, email: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ facilitators });
}
