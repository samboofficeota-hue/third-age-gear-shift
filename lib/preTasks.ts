/**
 * 事前課題（事前アンケート・じぶん紹介シート・ライフラインチャート）の記入状況。
 * 事前課題トップの「記入済み」表示と、ガイドの「提出済み」案内で同じ判定を使う。
 * （completedPhases の "pre" は1か所でも保存すると立つため、提出の判定には使えない）
 */
export type PreTaskStatus = {
  surveyDone: boolean;
  slideDone: boolean;
  lifeCurveDone: boolean;
  /** 3つとも記入済み＝提出できる状態 */
  allDone: boolean;
};

export function preTaskStatus(pre: unknown): PreTaskStatus {
  const p = (pre ?? null) as {
    survey?: Record<string, unknown>;
    profileSlide?: Record<string, unknown>;
    lifeCurve?: { points?: unknown[] };
  } | null;
  const surveyDone = !!p?.survey && Object.keys(p.survey).length > 0;
  const slideDone = !!p?.profileSlide && Object.keys(p.profileSlide).length > 0;
  const lifeCurveDone = !!p?.lifeCurve?.points && p.lifeCurve.points.length > 0;
  return { surveyDone, slideDone, lifeCurveDone, allDone: surveyDone && slideDone && lifeCurveDone };
}
