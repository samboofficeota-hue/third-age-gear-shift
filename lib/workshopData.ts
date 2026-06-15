import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  PHASE_META_BY_ID,
  getPhaseStatus,
  isPhaseAccessible,
  type PhaseId,
} from "@/lib/phases";

/**
 * フェーズJSONへの浅いマージPATCHを行う共通ハンドラ。
 * - 認証チェック
 * - gated フェーズは BlockStatus が OPEN でなければ 403（ゲーティング）
 * - body（または body.data）を該当フェーズJSONへ浅くマージ
 * - completedPhases に phaseId を追記
 */
export async function patchPhaseData(phaseId: PhaseId, request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "ログインしてください。" }, { status: 401 });
  }

  const meta = PHASE_META_BY_ID[phaseId];

  let wd = await prisma.workshopData.findUnique({
    where: { userId: session.sub },
  });
  if (!wd) {
    const userExists = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { id: true },
    });
    if (!userExists) {
      return NextResponse.json({ error: "ログインしてください。" }, { status: 401 });
    }
    wd = await prisma.workshopData.create({
      data: { userId: session.sub, completedPhases: [] },
    });
  }

  // ゲーティング: gated フェーズは当該セッションで OPEN のときのみ書き込み可
  if (meta.gated) {
    const status = await getPhaseStatus(wd.sessionId, phaseId);
    if (!isPhaseAccessible(meta, status)) {
      return NextResponse.json(
        { error: "この課題はまだ開放されていません。講師の案内をお待ちください。" },
        { status: 403 }
      );
    }
  }

  const body = await request.json().catch(() => ({}));
  const incoming = (
    body && typeof body === "object" && "data" in body ? body.data : body
  ) as Record<string, unknown>;

  const current = (wd[phaseId] as Record<string, unknown> | null) ?? {};
  const merged = { ...current, ...(incoming ?? {}) };

  const completedPhases = wd.completedPhases.includes(phaseId)
    ? wd.completedPhases
    : [...wd.completedPhases, phaseId];

  const data = {
    [phaseId]: merged as Prisma.InputJsonValue,
    completedPhases,
  } as Prisma.WorkshopDataUpdateInput;

  const updated = await prisma.workshopData.update({
    where: { userId: session.sub },
    data,
  });

  return NextResponse.json({
    [phaseId]: updated[phaseId],
    completedPhases: updated.completedPhases,
  });
}
