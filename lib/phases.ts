import { prisma } from "@/lib/db";

/**
 * フェーズ（新5フェーズ構成）の単一情報源。
 * admin / データAPI / ゲーティング はすべてここを import する。
 * BlockStatus.blockId にはこの phaseId 文字列をそのまま入れる（スキーマ変更不要）。
 */

export type PhaseId = "pre" | "day1" | "homework" | "day2" | "post";
export type PhaseTrack = "survey" | "worksheet" | "mixed";
export type BlockStatusValue = "LOCKED" | "PREVIEW" | "OPEN" | "CLOSED";

export const PHASE_IDS: PhaseId[] = ["pre", "day1", "homework", "day2", "post"];

export interface PhaseMeta {
  id: PhaseId;
  shortLabel: string; // 管理画面のリスト表示用
  label: string; // フルラベル
  day: string; // 「事前」「DAY 1」「宿題」「DAY 2」「事後」
  track: PhaseTrack; // survey=スマホ対応 / worksheet=A4横 / mixed=両方
  program: ProgramId; // A=ダーク(/workshop) / B=ライト本番(/training)
  gated: boolean; // false = 最初から開放（pre のみ）
  route: string;
  description: string;
}

/** A=調査+じぶん紹介(ダーク/workshop) ／ B=研修本番(ライト/training) */
export type ProgramId = "A" | "B";

export const PHASE_META: PhaseMeta[] = [
  {
    id: "pre",
    shortLabel: "事前",
    label: "事前課題",
    day: "事前",
    track: "mixed",
    program: "A",
    gated: false,
    route: "/workshop/pre",
    description: "事前アンケート ＋ じぶん紹介",
  },
  {
    id: "day1",
    shortLabel: "Day 1",
    label: "Day 1：じぶん分解・じぶん分析",
    day: "DAY 1",
    track: "worksheet",
    program: "B",
    gated: true,
    route: "/training/day1",
    description: "じぶん分解／じぶん分析",
  },
  {
    id: "homework",
    shortLabel: "宿題",
    label: "宿題：みらいシナリオ",
    day: "宿題",
    track: "worksheet",
    program: "B",
    gated: true,
    route: "/training/homework",
    description: "2040年のじぶんがいる社会",
  },
  {
    id: "day2",
    shortLabel: "Day 2",
    label: "Day 2：ビジョン・資本・シフト戦略",
    day: "DAY 2",
    track: "worksheet",
    program: "B",
    gated: true,
    route: "/training/day2",
    description: "ビジョン策定／資本戦略／シフト戦略",
  },
  {
    id: "post",
    shortLabel: "事後",
    label: "事後課題",
    day: "事後",
    track: "survey",
    program: "A",
    gated: true,
    route: "/workshop/post",
    description: "事後アンケート",
  },
];

export const PHASE_META_BY_ID: Record<PhaseId, PhaseMeta> = Object.fromEntries(
  PHASE_META.map((p) => [p.id, p])
) as Record<PhaseId, PhaseMeta>;

export function isPhaseId(v: string): v is PhaseId {
  return (PHASE_IDS as string[]).includes(v);
}

/**
 * (sessionId, phaseId) の BlockStatus を返す。行が無ければ LOCKED。
 */
export async function getPhaseStatus(
  sessionId: string | null | undefined,
  phaseId: PhaseId
): Promise<BlockStatusValue> {
  if (!sessionId) return "LOCKED";
  const row = await prisma.blockStatus.findUnique({
    where: { sessionId_blockId: { sessionId, blockId: phaseId } },
  });
  return (row?.status as BlockStatusValue) ?? "LOCKED";
}

/**
 * セッションの全フェーズのステータスをまとめて返す（クライアントのゲーティング用）。
 */
export async function getAllPhaseStatuses(
  sessionId: string | null | undefined
): Promise<Record<PhaseId, BlockStatusValue>> {
  const base = Object.fromEntries(
    PHASE_IDS.map((id) => [id, "LOCKED"])
  ) as Record<PhaseId, BlockStatusValue>;
  if (!sessionId) return base;
  const rows = await prisma.blockStatus.findMany({ where: { sessionId } });
  for (const r of rows) {
    if (isPhaseId(r.blockId)) base[r.blockId] = r.status as BlockStatusValue;
  }
  return base;
}

/**
 * 受講生がそのフェーズにアクセス/書き込みできるか。
 * gated=false（pre）は常に可。それ以外は OPEN のときのみ可。
 */
export function isPhaseAccessible(
  meta: PhaseMeta,
  status: BlockStatusValue
): boolean {
  if (!meta.gated) return true;
  return status === "OPEN";
}
