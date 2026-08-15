"use client";

import { useLayoutEffect, useRef, useState } from "react";
import {
  AGE_MAX,
  AGE_MIN,
  SCORE_MAX,
  SCORE_MIN,
  type PlottedPoint,
} from "@/app/workshop/pre/life-plan/_types";

const W = 1000;
const H = 510;
const PAD_L = 40;
const PAD_R = 24;
const PAD_T = 44;
const PAD_B = 44;
const innerW = W - PAD_L - PAD_R;
const innerH = H - PAD_T - PAD_B;

const TITLE_GAP = 14; // 点 → トピックの距離（最初の段）
const LINE_LEN = 10; // トピックは1行10字まで（最大20字・2行）
const LINE_HEIGHT = 15;

/** ラベル同士の最小間隔（水平方向） */
const LABEL_GAP = 8;
/** 段（row）を1つ増やすごとに、軸から離す距離 */
const ROW_HEIGHT = 34;

/**
 * 横軸（年齢）は 0-10歳・10-20歳・60-70歳が空欄になりやすいため、
 * この3つの帯を同じ幅（各8%）に圧縮し、空いた分を中央（20〜60歳）へ均等に配分する。
 */
const EDGE_FRAC = 0.08;
const BAND1_END = 10;
const BAND2_END = 20;
const MID_END = AGE_MAX - 10; // 60
const MID_FRAC = 1 - EDGE_FRAC * 3;

const x = (age: number) => {
  if (age <= BAND1_END) {
    const t = (age - AGE_MIN) / (BAND1_END - AGE_MIN);
    return PAD_L + t * EDGE_FRAC * innerW;
  }
  if (age <= BAND2_END) {
    const t = (age - BAND1_END) / (BAND2_END - BAND1_END);
    return PAD_L + EDGE_FRAC * innerW + t * EDGE_FRAC * innerW;
  }
  if (age <= MID_END) {
    const t = (age - BAND2_END) / (MID_END - BAND2_END);
    return PAD_L + EDGE_FRAC * 2 * innerW + t * MID_FRAC * innerW;
  }
  const t = (age - MID_END) / (AGE_MAX - MID_END);
  return PAD_L + (EDGE_FRAC * 2 + MID_FRAC) * innerW + t * EDGE_FRAC * innerW;
};
const y = (score: number) => PAD_T + ((SCORE_MAX - score) / (SCORE_MAX - SCORE_MIN)) * innerH;

/** トピックは最大20字・1行10字で2行に折り返す */
function splitTitle(title: string): [string, string] {
  if (title.length <= LINE_LEN) return [title, ""];
  return [title.slice(0, LINE_LEN), title.slice(LINE_LEN, LINE_LEN * 2)];
}

type Box = { left: number; right: number; top: number; bottom: number };

function boxesOverlap(a: Box, b: Box, gap: number): boolean {
  return (
    a.left < b.right + gap &&
    a.right + gap > b.left &&
    a.top < b.bottom + gap &&
    a.bottom + gap > b.top
  );
}

const MAX_ROW = 8;

/**
 * 同じ上下象限（above/below）内で、年齢順に並んだラベルの重なりを
 * 実測（getBBox）してから解消する（衝突回避）。
 * ラベルの x 位置は常にその点の年齢のまま動かさず、既に置いたラベルと
 * 実際の矩形が重なる場合だけ、段（row）を1つ外側にずらす（軸からの距離を増やす）。
 * 点数（score）が点ごとに違うため、rowが同じでも絶対Y座標は点によって異なる。
 * そのため「同じrow同士」ではなく、実際の矩形同士で判定する。
 *
 * 実測bboxは「前回すでに適用した段ズレ」を含んだ状態で返ってくる（Reactの
 * useLayoutEffectは同じpropsでも複数回走りうる＝StrictModeや親の再レンダリング）。
 * 前回のrowから逆算してズレを差し引き、常に「段0（自然な位置）」を基準に測り直す。
 */
function assignRows(
  group: PlottedPoint[],
  els: Map<number, SVGTextElement>,
  above: boolean,
  prevRows: Map<number, number>
): Map<number, number> {
  const result = new Map<number, number>();
  const placed: Box[] = [];

  for (const p of group) {
    const el = els.get(p.index);
    const rawBbox = el?.getBBox();
    if (!rawBbox) {
      result.set(p.index, 0);
      continue;
    }
    const prevRow = prevRows.get(p.index) ?? 0;
    const prevDelta = above ? -prevRow * ROW_HEIGHT : prevRow * ROW_HEIGHT;
    const naturalY = rawBbox.y - prevDelta;

    let row = 0;
    let box: Box = { left: rawBbox.x, right: rawBbox.x + rawBbox.width, top: naturalY, bottom: naturalY + rawBbox.height };
    while (row < MAX_ROW) {
      const delta = above ? -row * ROW_HEIGHT : row * ROW_HEIGHT;
      box = {
        left: rawBbox.x,
        right: rawBbox.x + rawBbox.width,
        top: naturalY + delta,
        bottom: naturalY + rawBbox.height + delta,
      };
      if (!placed.some((pb) => boxesOverlap(box, pb, LABEL_GAP))) break;
      row++;
    }
    placed.push(box);
    result.set(p.index, row);
  }
  return result;
}

/**
 * ライフラインチャート（年齢 × 点数の折れ線グラフ）。
 * 横軸=年齢 0〜70歳・縦軸=点数 -10〜+10 で固定表示する。
 * トピックはプロット上に常時表示（上象限=点の上／下象限=点の下）。
 * プロットをクリックすると onPointClick(index) が呼ばれる（編集モードへの入口）。
 */
export function LifeLineChart({
  points,
  onPointClick,
}: {
  points: PlottedPoint[];
  onPointClick?: (index: number) => void;
}) {
  const textRefs = useRef(new Map<number, SVGTextElement>());
  const prevRowsRef = useRef<Map<number, number>>(new Map());
  const [rows, setRows] = useState<Map<number, number>>(new Map());

  useLayoutEffect(() => {
    const aboveGroup = points.filter((p) => p.score >= 0);
    const belowGroup = points.filter((p) => p.score < 0);
    const merged = new Map([
      ...assignRows(aboveGroup, textRefs.current, true, prevRowsRef.current),
      ...assignRows(belowGroup, textRefs.current, false, prevRowsRef.current),
    ]);
    prevRowsRef.current = merged;
    setRows(merged);
  }, [points]);

  const zeroY = y(0);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.age).toFixed(1)} ${y(p.score).toFixed(1)}`).join(" ");
  const yTicks = [SCORE_MAX, SCORE_MAX / 2, 0, SCORE_MIN / 2, SCORE_MIN];
  const xTicks: number[] = [];
  for (let a = AGE_MIN; a <= AGE_MAX; a += 10) xTicks.push(a);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full overflow-visible"
      role="img"
      aria-label="ライフラインチャート"
    >
      {/* 縦グリッド線（10歳刻み） */}
      {xTicks.map((a) => (
        <line key={a} x1={x(a)} y1={PAD_T} x2={x(a)} y2={H - PAD_B} stroke="#E5E7EB" strokeWidth={1} />
      ))}
      {xTicks.map((a) => (
        <text key={a} x={x(a)} y={H - PAD_B + 18} textAnchor="middle" fontSize={12} fill="#6B7280">
          {a}歳
        </text>
      ))}

      {/* 横グリッド線 */}
      {yTicks.map((t) => (
        <line
          key={t}
          x1={PAD_L}
          y1={y(t)}
          x2={W - PAD_R}
          y2={y(t)}
          stroke={t === 0 ? "#129B86" : "#D1D5DB"}
          strokeWidth={t === 0 ? 1.5 : 1}
        />
      ))}
      {yTicks.map((t) => (
        <text key={t} x={PAD_L - 8} y={y(t) + 4} textAnchor="end" fontSize={12} fill="#6B7280">
          {t > 0 ? `+${t}` : t}
        </text>
      ))}

      {points.length >= 2 && (
        <path d={path} fill="none" stroke="#129B86" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
      )}

      {points.map((p) => {
        const above = p.score >= 0;
        const row = rows.get(p.index) ?? 0;
        const gap = TITLE_GAP + row * ROW_HEIGHT;
        const titleY = y(p.score) + (above ? -gap : gap + 12);
        const [line1, line2] = splitTitle(p.title);
        const labelX = x(p.age);

        return (
          <g key={p.index}>
            {p.title.trim() && (
              <text
                ref={(el) => {
                  if (el) textRefs.current.set(p.index, el);
                  else textRefs.current.delete(p.index);
                }}
                x={labelX}
                y={titleY}
                textAnchor="middle"
                fontSize={13}
                fontWeight={700}
                fill="#1F2937"
              >
                <tspan x={labelX} dy={0}>
                  {line1}
                </tspan>
                {line2 && (
                  <tspan x={labelX} dy={LINE_HEIGHT}>
                    {line2}
                  </tspan>
                )}
              </text>
            )}

            <circle
              cx={x(p.age)}
              cy={y(p.score)}
              r={6}
              fill="#129B86"
              stroke="#FFFFFF"
              strokeWidth={2}
              className={onPointClick ? "cursor-pointer" : undefined}
              onClick={() => onPointClick?.(p.index)}
            />
          </g>
        );
      })}

      <line x1={PAD_L} y1={zeroY} x2={W - PAD_R} y2={zeroY} stroke="transparent" />
    </svg>
  );
}
