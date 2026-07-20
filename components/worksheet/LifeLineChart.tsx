import {
  AGE_MAX,
  AGE_MIN,
  SCORE_MAX,
  SCORE_MIN,
  type PlottedPoint,
} from "@/app/workshop/pre/life-plan/_types";

/** チャート本体の大きさは固定（優先度：チャート＞説明ボックス）。説明ボックスは付随情報として、
 * 必要ならこの領域の外側（余白）にはみ出して表示する（<svg overflow="visible"> で切れないようにする）。 */
const W = 1000;
const H = 510;
const PAD_L = 40;
const PAD_R = 24;
const PAD_T = 44;
const PAD_B = 44;
const innerW = W - PAD_L - PAD_R;
const innerH = H - PAD_T - PAD_B;

const TITLE_GAP = 14; // 点 → 見出しの距離
const BOX_GAP = 6; // 見出し → 説明ボックスの距離
const BOX_W = 210;
const BOX_H = 46; // 40字・2行想定

/** 点数が ±9・±10 の極端な位置では、上下ではなくボックスを見出しの右側に配置する（頻度は低い想定） */
const EXTREME_SCORE = 9;

const x = (age: number) => PAD_L + ((age - AGE_MIN) / (AGE_MAX - AGE_MIN)) * innerW;
const y = (score: number) => PAD_T + ((SCORE_MAX - score) / (SCORE_MAX - SCORE_MIN)) * innerH;

/**
 * ライフラインチャート（年齢 × 点数の折れ線グラフ）。
 * 横軸=年齢 0〜70歳・縦軸=点数 -10〜+10 で固定表示する。
 * 見出しはプロット上に常時表示（上象限=点の上／下象限=点の下）、
 * 説明はその見出しのさらに外側（上象限=見出しの上／下象限=見出しの下）にボックス表示する。
 * プロットをクリックすると onPointClick(index) が呼ばれる（編集モードへの入口）。
 */
export function LifeLineChart({
  points,
  onPointClick,
}: {
  points: PlottedPoint[];
  onPointClick?: (index: number) => void;
}) {
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
        const extreme = Math.abs(p.score) >= EXTREME_SCORE;
        const titleY = y(p.score) + (above ? -TITLE_GAP : TITLE_GAP + 12);

        // 見出しの右側に置く場合：見出し中央からおおよその半幅ぶん右へ離す（見出しは最大14文字に丸めているため固定オフセットで足りる）
        const boxX = extreme ? x(p.age) + 82 : x(p.age) - BOX_W / 2;
        const boxY = extreme
          ? titleY - BOX_H / 2 - 3
          : above
            ? titleY - 16 - BOX_GAP - BOX_H
            : titleY + BOX_GAP;

        return (
          <g key={p.index}>
            {p.title.trim() && (
              <text x={x(p.age)} y={titleY} textAnchor="middle" fontSize={13} fontWeight={700} fill="#1F2937">
                {p.title.length > 14 ? `${p.title.slice(0, 14)}…` : p.title}
              </text>
            )}

            {p.description.trim() && (
              <foreignObject x={boxX} y={boxY} width={BOX_W} height={BOX_H}>
                <div
                  className="flex h-full items-center justify-center rounded-md border border-ws-line bg-white px-2 py-1 text-center leading-snug"
                  style={{ fontSize: 12, color: "#000000" }}
                >
                  {p.description}
                </div>
              </foreignObject>
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
