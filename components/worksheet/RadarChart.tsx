"use client";

/**
 * レーダーチャート（コミュニティ活動力 自己診断の可視化）。
 * items を頂点に時計回り（①が上）でプロットする。
 */

export function RadarChart({
  items,
  max = 12,
  step = 2,
}: {
  items: { label: string; value: number }[];
  max?: number;
  step?: number;
}) {
  const N = items.length;
  const cx = 350;
  const cy = 330;
  const R = 200;

  const angle = (i: number) => ((-90 + (i * 360) / N) * Math.PI) / 180;
  const pt = (i: number, rad: number): [number, number] => [
    cx + rad * Math.cos(angle(i)),
    cy + rad * Math.sin(angle(i)),
  ];

  const steps: number[] = [];
  for (let s = step; s <= max; s += step) steps.push(s);

  const valuePoly = items
    .map((it, i) => pt(i, (R * Math.max(0, Math.min(it.value, max))) / max))
    .map((p) => p.join(","))
    .join(" ");

  return (
    <svg viewBox="0 0 700 660" className="h-auto w-full" role="img" aria-label="自己診断レーダーチャート">
      {/* グリッド（同心円） */}
      {steps.map((s) => (
        <circle
          key={s}
          cx={cx}
          cy={cy}
          r={(R * s) / max}
          fill="none"
          stroke="#E5E7EB"
        />
      ))}
      {/* 軸線 */}
      {items.map((_, i) => {
        const [x, y] = pt(i, R);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#E5E7EB" />;
      })}
      {/* スケール目盛（上軸に沿って 0,2,…,max） */}
      <text x={cx - 10} y={cy + 4} textAnchor="end" className="fill-ws-muted" style={{ fontSize: 13 }}>
        0
      </text>
      {steps.map((s) => (
        <text
          key={s}
          x={cx - 10}
          y={cy - (R * s) / max + 4}
          textAnchor="end"
          className="fill-ws-muted"
          style={{ fontSize: 13 }}
        >
          {s}
        </text>
      ))}
      {/* 値のポリゴン */}
      <polygon points={valuePoly} fill="#2563EB" fillOpacity="0.12" stroke="#2563EB" strokeWidth="3" />
      {items.map((it, i) => {
        const [x, y] = pt(i, (R * Math.max(0, Math.min(it.value, max))) / max);
        return <circle key={i} cx={x} cy={y} r="4.5" fill="#2563EB" />;
      })}
      {/* 軸ラベル */}
      {items.map((it, i) => {
        const [x, y] = pt(i, R + 28);
        const c = Math.cos(angle(i));
        const anchor = Math.abs(c) < 0.3 ? "middle" : c > 0 ? "start" : "end";
        return (
          <text
            key={i}
            x={x}
            y={y + 4}
            textAnchor={anchor}
            className="fill-ws-ink"
            style={{ fontSize: 16, fontWeight: 600 }}
          >
            {it.label}
          </text>
        );
      })}
    </svg>
  );
}
