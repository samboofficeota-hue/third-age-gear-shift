import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

/** 出欠の記録（Day1 / Day2）。講師も当日の現場で操作するので requireAdmin。 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  for (const key of ["attendanceDay1", "attendanceDay2"] as const) {
    if (key in body) {
      data[key] = typeof body[key] === "boolean" ? body[key] : null;
    }
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "attendanceDay1 / attendanceDay2 のいずれかが必要です。" },
      { status: 400 }
    );
  }

  // 講師は担当セッションの受講生のみ
  const workshopData = await prisma.workshopData.findFirst({
    where: {
      userId: params.id,
    },
    select: { id: true },
  });
  if (!workshopData) {
    return NextResponse.json(
      { error: "受講生が見つからないか、操作権限がありません。" },
      { status: 404 }
    );
  }

  const updated = await prisma.workshopData.update({
    where: { id: workshopData.id },
    data,
    select: { attendanceDay1: true, attendanceDay2: true },
  });

  return NextResponse.json({ participant: { id: params.id, ...updated } });
}
