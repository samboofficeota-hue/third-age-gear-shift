import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  getAllPhaseStatuses,
  PHASE_META_BY_ID,
  isPhaseAccessible,
  type PhaseId,
  type BlockStatusValue,
} from "@/lib/phases";

/**
 * サーバーコンポーネントからフェーズの開放判定を行う（チラ見え防止のゲーティング）。
 * 戻り値 ok=false のとき、ページ側で redirect('/workshop') する。
 */
export async function canAccessPhase(
  phaseId: PhaseId
): Promise<{ ok: boolean; sessionId: string | null; status: BlockStatusValue }> {
  const session = await getSession();
  if (!session) return { ok: false, sessionId: null, status: "LOCKED" };

  const wd = await prisma.workshopData.findUnique({
    where: { userId: session.sub },
    select: { sessionId: true },
  });

  const meta = PHASE_META_BY_ID[phaseId];
  const statuses = await getAllPhaseStatuses(wd?.sessionId);
  const status = statuses[phaseId];
  return {
    ok: isPhaseAccessible(meta, status),
    sessionId: wd?.sessionId ?? null,
    status,
  };
}

/**
 * ダッシュボード用：全フェーズの状態＋完了状況を返す。
 */
export async function getDashboardState() {
  const session = await getSession();
  if (!session) return null;

  const wd = await prisma.workshopData.findUnique({
    where: { userId: session.sub },
    select: { sessionId: true, completedPhases: true },
  });

  const statuses = await getAllPhaseStatuses(wd?.sessionId);
  return {
    sessionId: wd?.sessionId ?? null,
    completedPhases: (wd?.completedPhases ?? []) as PhaseId[],
    statuses,
  };
}
