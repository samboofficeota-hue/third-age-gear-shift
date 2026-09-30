"use client";

import { useMemo } from "react";
import {
  AGE_MAX,
  AGE_MIN,
  SCORE_MAX,
  SCORE_MIN,
  TITLE_MAX_LENGTH,
  type PlottedPoint,
} from "@/app/workshop/pre/life-plan/_types";

// トピックは2行に折り返す（入力上限16字 → 1行8字）。入力上限を変えるとカード幅も追従する
const LINE_LEN = Math.ceil(TITLE_MAX_LENGTH / 2);
const LINE_HEIGHT = 15;
const FONT_SIZE = 13;

/**
 * トピックは全部同じ大きさの「2行組みのカード」で表示する（1行のトピックでも2行分の高さ）。
 * 大きさが揃っているので、段（row）＝カードの高さ＋すき間 で機械的にずらせる。
 */
const CARD_PAD_X = 6;
const CARD_PAD_Y = 5;
const CARD_W = LINE_LEN * FONT_SIZE + CARD_PAD_X * 2; // 116
const CARD_H = LINE_HEIGHT * 2 + CARD_PAD_Y * 2; // 40
const CARD_GAP = 10; // 点 → カードの距離（最初の段）
const ROW_GAP = 4; // 段と段のすき間
const ROW_HEIGHT = CARD_H + ROW_GAP;

const W = 1000;
const PAD_L = 40;
const PAD_R = 24;
/** +10 の上に、カード1段ぶんの余白（+10 の点のカードも点の上に置ける） */
const PAD_T = CARD_GAP + CARD_H + ROW_GAP; // 54
const PAD_B = 44;
/** グラフ本体（+10〜-10）の高さ。上余白を足しても本体の大きさは変えない */
const innerH = 422;
const H = PAD_T + innerH + PAD_B; // 520
const innerW = W - PAD_L - PAD_R;
/** カード同士の最小間隔 */
const LABEL_GAP = 4;
const MAX_ROW = 8;
/** 点（●）の当たり判定の半径（描画 r=6 ＋ 白ふち） */
const DOT_R = 8;
/** カードを置いてよい範囲。上下＝SVGの上端〜グラフ下端、左右＝SVGの幅 */
const BOUND_TOP = 0;
const BOUND_BOTTOM = H - PAD_B;
const BOUND_LEFT = 0;
const BOUND_RIGHT = W;

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

/** トピックは最大16字・1行8字で2行に折り返す */
function splitTitle(title: string): [string, string] {
  if (title.length <= LINE_LEN) return [title, ""];
  return [title.slice(0, LINE_LEN), title.slice(LINE_LEN, LINE_LEN * 2)];
}

type Box = { left: number; right: number; top: number; bottom: number };
type Side = "above" | "below";
type Placement = { side: Side; row: number };

function boxesOverlap(a: Box, b: Box, gap: number): boolean {
  return (
    a.left < b.right + gap &&
    a.right + gap > b.left &&
    a.top < b.bottom + gap &&
    a.bottom + gap > b.top
  );
}

/** カードの中心X。点の真上（真下）が基本で、左右の端では範囲内へ寄せる */
function cardCenterX(p: PlottedPoint): number {
  const half = CARD_W / 2;
  return Math.min(Math.max(x(p.age), BOUND_LEFT + half), BOUND_RIGHT - half);
}

/** 側（上/下）と段から、カードの矩形を計算する */
function cardBox(p: PlottedPoint, { side, row }: Placement): Box {
  const gap = CARD_GAP + row * ROW_HEIGHT;
  const cx = cardCenterX(p);
  const cy = y(p.score);
  const top = side === "above" ? cy - gap - CARD_H : cy + gap;
  return { left: cx - CARD_W / 2, right: cx + CARD_W / 2, top, bottom: top + CARD_H };
}

/**
 * カードの置き場所を決める（段の考え方で衝突回避）。
 * 年齢順に1つずつ、次の順で試し、最初に「範囲内」かつ「既に置いたカード・点と重ならない」位置を採用する。
 *   1. 本来の側（点数0以上=上／マイナス=下）で、点に近い段から外側へ
 *   2. それでも無ければ逆側で、点に近い段から外側へ
 * どこにも置けなければ、範囲内に収まる最も近い位置（重なりは許容）、それも無ければ本来の側の段0。
 */
function assignPlacements(points: PlottedPoint[]): Map<number, Placement> {
  const result = new Map<number, Placement>();
  const dots: Box[] = points.map((p) => ({
    left: x(p.age) - DOT_R,
    right: x(p.age) + DOT_R,
    top: y(p.score) - DOT_R,
    bottom: y(p.score) + DOT_R,
  }));
  const placed: Box[] = [];
  const inBounds = (b: Box) =>
    b.top >= BOUND_TOP && b.bottom <= BOUND_BOTTOM && b.left >= BOUND_LEFT && b.right <= BOUND_RIGHT;
  const hits = (b: Box) =>
    placed.some((pb) => boxesOverlap(b, pb, LABEL_GAP)) || dots.some((d) => boxesOverlap(b, d, 2));

  for (const p of points) {
    if (!p.title.trim()) continue;
    const preferred: Side = p.score >= 0 ? "above" : "below";
    const opposite: Side = preferred === "above" ? "below" : "above";
    const candidates: Placement[] = [];
    for (const side of [preferred, opposite]) {
      for (let row = 0; row < MAX_ROW; row++) candidates.push({ side, row });
    }
    const chosen =
      candidates.find((c) => {
        const b = cardBox(p, c);
        return inBounds(b) && !hits(b);
      }) ??
      candidates.find((c) => inBounds(cardBox(p, c))) ?? { side: preferred, row: 0 };

    placed.push(cardBox(p, chosen));
    result.set(p.index, chosen);
  }
  return result;
}

/**
 * ライフラインチャート（年齢 × 点数の折れ線グラフ）。
 * 横軸=年齢 0〜70歳・縦軸=点数 -10〜+10 で固定表示する。
 * トピックは2行組みのカードで常時表示（上象限=点の上／下象限=点の下。範囲からはみ出す・重なるときは段をずらし、
 * それでも置けなければ逆側へ）。描く順は 折れ線 → カード → 点。
 * プロットをクリックすると onPointClick(index) が呼ばれる（編集モードへの入口）。
 */
export function LifeLineChart({
  points,
  onPointClick,
}: {
  points: PlottedPoint[];
  onPointClick?: (index: number) => void;
}) {
  const placements = useMemo(() => assignPlacements(points), [points]);

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

      {/* トピックのカード（折れ線の上・点の下に描く） */}
      {points.map((p) => {
        if (!p.title.trim()) return null;
        const placement = placements.get(p.index) ?? { side: p.score >= 0 ? "above" : "below", row: 0 };
        const box = cardBox(p, placement);
        const [line1, line2] = splitTitle(p.title);
        const cx = (box.left + box.right) / 2;
        // 1行なら上下中央、2行なら2行で上下中央（ベースラインは文字高の約0.8）
        const lines = line2 ? 2 : 1;
        const firstBaseline =
          box.top + (CARD_H - lines * LINE_HEIGHT) / 2 + LINE_HEIGHT * 0.5 + FONT_SIZE * 0.35;
        return (
          <g key={`card-${p.index}`}>
            <rect
              x={box.left}
              y={box.top}
              width={CARD_W}
              height={CARD_H}
              rx={6}
              fill="#FFFFFF"
              stroke="#CBD5E1"
              strokeWidth={1}
            />
            <text textAnchor="middle" fontSize={FONT_SIZE} fontWeight={700} fill="#1F2937">
              <tspan x={cx} y={firstBaseline}>
                {line1}
              </tspan>
              {line2 && (
                <tspan x={cx} y={firstBaseline + LINE_HEIGHT}>
                  {line2}
                </tspan>
              )}
            </text>
          </g>
        );
      })}

      {/* 点（いちばん上） */}
      {points.map((p) => (
        <circle
          key={`dot-${p.index}`}
          cx={x(p.age)}
          cy={y(p.score)}
          r={6}
          fill="#129B86"
          stroke="#FFFFFF"
          strokeWidth={2}
          className={onPointClick ? "cursor-pointer" : undefined}
          onClick={() => onPointClick?.(p.index)}
        />
      ))}

      <line x1={PAD_L} y1={zeroY} x2={W - PAD_R} y2={zeroY} stroke="transparent" />
    </svg>
  );
}
