/**
 * ライフラインチャート（人生曲線）の型と初期値。
 * WorkshopData.pre.lifeCurve に保存する。
 */

export type LifeCurvePoint = {
  /** 年齢（0〜70。チャート横軸の範囲と一致。未入力は null） */
  age: number | null;
  /** 見出し（チャート上のプロットに表示） */
  title: string;
  /** 説明：内容や気持ち（40字以内・2行想定。見出しの外側にボックスで常時表示） */
  description: string;
  /** 点数（-10〜+10、0 が普通） */
  score: number;
};

export type LifeCurve = {
  points: LifeCurvePoint[];
};

/** チャート描画用：年齢が確定している点（元の points 配列内インデックスを保持） */
export type PlottedPoint = LifeCurvePoint & {
  age: number;
  /** points 配列内の元インデックス（クリック編集・更新時に使用） */
  index: number;
};

export const SCORE_MIN = -10;
export const SCORE_MAX = 10;
export const SCORE_STEP = 1;

export const DESCRIPTION_MAX_LENGTH = 40;

/** チャートの横軸（年齢）は 0〜70 歳で固定表示する */
export const AGE_MIN = 0;
export const AGE_MAX = 70;

export function clampScore(v: number): number {
  return Math.max(SCORE_MIN, Math.min(SCORE_MAX, v));
}

export function clampAge(v: number): number {
  return Math.max(AGE_MIN, Math.min(AGE_MAX, v));
}

/** 空の入力欄の初期値 */
export const EMPTY_DRAFT: LifeCurvePoint = { age: null, title: "", description: "", score: 0 };

export function normalizePoints(points?: LifeCurvePoint[] | null): LifeCurvePoint[] {
  return (points ?? []).map((p) => ({
    age: typeof p.age === "number" ? clampAge(p.age) : null,
    title: p.title ?? "",
    description: (p.description ?? "").slice(0, DESCRIPTION_MAX_LENGTH),
    score: clampScore(typeof p.score === "number" ? p.score : 0),
  }));
}

/** チャート描画用：年齢が入っている点だけを年齢昇順で返す（元インデックス付き） */
export function sortedForChart(points: LifeCurvePoint[]): PlottedPoint[] {
  return points
    .map((p, index) => ({ ...p, index }))
    .filter((p): p is LifeCurvePoint & { age: number; index: number } => typeof p.age === "number")
    .sort((a, b) => a.age - b.age);
}
