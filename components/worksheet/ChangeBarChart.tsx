/**
 * 「働くことへの意識の変化」用の棒＋折れ線グラフ（レポート専用）。
 *
 * - 縦棒: 区分ごとに「事前」「事後」を並べる（各区分内の設問平均）
 * - 折れ線: 調査母体の平均値を重ねる（比較が本来の目的。docs/REPORT_DESIGN.md §1.3）
 *
 * 凡例はSVG内の右上に描く（外に置くと高さが読めず、カードに収める計算が狂うため）。
 * 高さは親に合わせて伸縮する（`h-full`）。A4横1枚に収める都合で縦の余裕が少ないため。
 *
 * 白地・印刷前提のため色は ws-* トークン準拠の実値を使う（SVG属性のためclassでは指定しない）。
 */

const TEAL = "#129B86";
const TEAL_LIGHT = "#9BD3C9";
const LINE = "#E5277E";
const GRID = "#D1D5DB";
const MUTED = "#6B7280";
const INK = "#1F2937";

export type ChangeGroup = {
  /** 軸ラベル（設問の短縮名） */
  label: string;
  /** 一意キー（設問キー） */
  id: string;
  /** 目盛下に出す番号（例: "1"） */
  no?: string;
  /** 事前の回答。未回答は null */
  pre: number | null;
  /** 事後の回答。未回答は null */
  post: number | null;
  /**
   * 調査母体の平均。**出典調査に5段階平均は存在しない**ため常に null。
   * 詳細と経緯は docs/REPORT_DESIGN.md §1.3 の警告ブロックを参照。
   */
  benchmark: number | null;
};

const W = 460;
const H = 199;
const PAD_L = 26;
const PAD_R = 8;
/** 上は凡例の帯を確保する */
const PAD_T = 26;
const PAD_B = 42;
const MIN = 1;
const MAX = 5;

/** 凡例1項目あたりの見積り幅（右上から右詰めで並べる） */
const LEGEND_ITEM_W = 52;
const LEGEND_SWATCH_W = 13;

/** 軸ラベルを n 文字ずつ最大2行に折り返す（3行目以降は「…」で締める） */
function wrap(s: string, n: number): string[] {
  if (s.length <= n) return [s];
  const first = s.slice(0, n);
  const rest = s.slice(n);
  return [first, rest.length <= n ? rest : `${rest.slice(0, n - 1)}…`];
}

export function ChangeBarChart({ groups }: { groups: ChangeGroup[] }) {
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;
  const bandW = plotW / groups.length;

  /** 値(1〜5) → Y座標 */
  const y = (v: number) =>
    PAD_T + plotH - ((Math.max(MIN, Math.min(v, MAX)) - MIN) / (MAX - MIN)) * plotH;

  const ticks = [1, 2, 3, 4, 5];

  // 棒の幅とバンド内の配置（事前・事後の2本）
  const barW = Math.min(40, bandW * 0.24);
  const gap = 9;
  const centerOf = (i: number) => PAD_L + bandW * i + bandW / 2;
  const preX = (i: number) => centerOf(i) - gap / 2 - barW;
  const postX = (i: number) => centerOf(i) + gap / 2;

  const benchPoints = groups
    .map((g, i) => (g.benchmark != null ? `${centerOf(i)},${y(g.benchmark)}` : null))
    .filter((p): p is string => !!p)
    .join(" ");
  const hasBenchmark = groups.some((g) => g.benchmark != null);

  const legend: { label: string; color: string; dashed?: boolean }[] = [
    { label: "事前", color: TEAL_LIGHT },
    { label: "事後", color: TEAL },
    ...(hasBenchmark ? [{ label: "母体平均", color: LINE, dashed: true }] : []),
  ];
  const legendW = legend.length * LEGEND_ITEM_W;
  const legendX = W - PAD_R - legendW;

  const bar = (x: number, v: number | null, fill: string) => {
    if (v == null) return null;
    const top = y(v);
    return (
      <>
        <rect x={x} y={top} width={barW} height={PAD_T + plotH - top} fill={fill} rx={2} />
        <text
          x={x + barW / 2}
          y={top - 4}
          textAnchor="middle"
          fill={INK}
          style={{ fontSize: 11, fontWeight: 700 }}
        >
          {v.toFixed(1)}
        </text>
      </>
    );
  };

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      className="h-full w-full"
      role="img"
      aria-label="働くことへの意識の変化（事前・事後と調査母体平均の比較）"
    >
      {/* 凡例（右上） */}
      {legend.map((l, i) => {
        const x = legendX + i * LEGEND_ITEM_W;
        return (
          <g key={l.label}>
            {l.dashed ? (
              <line
                x1={x}
                y1={11}
                x2={x + LEGEND_SWATCH_W}
                y2={11}
                stroke={l.color}
                strokeWidth={2}
                strokeDasharray="4 3"
              />
            ) : (
              <rect x={x} y={6} width={LEGEND_SWATCH_W} height={10} fill={l.color} rx={2} />
            )}
            <text
              x={x + LEGEND_SWATCH_W + 4}
              y={15}
              fill={MUTED}
              style={{ fontSize: 11 }}
            >
              {l.label}
            </text>
          </g>
        );
      })}

      {/* 目盛線 */}
      {ticks.map((t) => (
        <g key={t}>
          <line x1={PAD_L} y1={y(t)} x2={W - PAD_R} y2={y(t)} stroke={GRID} strokeWidth={1} />
          <text
            x={PAD_L - 8}
            y={y(t) + 4}
            textAnchor="end"
            fill={MUTED}
            style={{ fontSize: 11 }}
          >
            {t}
          </text>
        </g>
      ))}

      {/* 棒（事前・事後） */}
      {groups.map((g, i) => (
        <g key={g.id}>
          {bar(preX(i), g.pre, TEAL_LIGHT)}
          {bar(postX(i), g.post, TEAL)}
          {g.no && (
            <text
              x={centerOf(i)}
              y={PAD_T + plotH + 14}
              textAnchor="middle"
              fill={TEAL}
              style={{ fontSize: 10, fontWeight: 700 }}
            >
              {g.no}
            </text>
          )}
          {/* 6問並ぶと横に収まらないため、ラベルは2行まで折り返す */}
          {wrap(g.label, 6).map((row, li) => (
            <text
              key={li}
              x={centerOf(i)}
              y={PAD_T + plotH + (g.no ? 27 : 15) + li * 11}
              textAnchor="middle"
              fill={INK}
              style={{ fontSize: 10 }}
            >
              {row}
            </text>
          ))}
        </g>
      ))}

      {/* 折れ線（調査母体の平均） */}
      {hasBenchmark && (
        <>
          <polyline
            points={benchPoints}
            fill="none"
            stroke={LINE}
            strokeWidth={2}
            strokeDasharray="5 3"
          />
          {groups.map((g, i) =>
            g.benchmark == null ? null : (
              <circle
                key={g.id}
                cx={centerOf(i)}
                cy={y(g.benchmark)}
                r={4}
                fill="#fff"
                stroke={LINE}
                strokeWidth={2}
              />
            )
          )}
        </>
      )}

      {/* 基線 */}
      <line
        x1={PAD_L}
        y1={PAD_T + plotH}
        x2={W - PAD_R}
        y2={PAD_T + plotH}
        stroke={MUTED}
        strokeWidth={1}
      />
    </svg>
  );
}
