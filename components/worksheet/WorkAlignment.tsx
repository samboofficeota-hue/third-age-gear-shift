"use client";

/**
 * 会社とじぶんの一致点（じぶん分析）。
 * じぶん∩会社のVenn図（黄色の重なり＝一致点）の上に、図と同じ並びで3つの問いを置く。
 * 左＝じぶん（なぜ今の会社で働こうと思ったか）／中央＝一致点（やりたいことと一致した点）／右＝会社（理念・ビジョン）。
 */

export type AlignmentData = {
  vision: string;
  whyWork: string;
  achieve: string;
};

/** じぶん（ピンク）∩会社（ブルー）＝一致点（イエロー）のVenn図 */
function VennDiagram() {
  return (
    <svg
      viewBox="0 0 460 200"
      className="h-auto w-full"
      role="img"
      aria-label="じぶんと会社の重なり（一致点）"
    >
      <defs>
        <clipPath id="alignLeftClip">
          <ellipse cx="140" cy="100" rx="135" ry="92" />
        </clipPath>
      </defs>
      <ellipse cx="140" cy="100" rx="135" ry="92" fill="#F9CEDC" stroke="#E5E7EB" />
      <ellipse cx="320" cy="100" rx="135" ry="92" fill="#CDE9F5" stroke="#E5E7EB" />
      {/* 重なり＝一致点（右の楕円を左の楕円でクリップして黄色に） */}
      <g clipPath="url(#alignLeftClip)">
        <ellipse cx="320" cy="100" rx="135" ry="92" fill="#EFEF3E" />
      </g>
      <text
        x="105"
        y="100"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-ws-ink"
        style={{ fontSize: 30, fontWeight: 700 }}
      >
        じぶん
      </text>
      <text
        x="350"
        y="100"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-ws-ink"
        style={{ fontSize: 30, fontWeight: 700 }}
      >
        会社
      </text>
    </svg>
  );
}

function Field({
  label,
  value,
  placeholder,
  rows,
  readOnly,
  onChange,
  headline = false,
}: {
  label: string;
  value: string;
  placeholder: string;
  rows: number;
  readOnly: boolean;
  onChange: (v: string) => void;
  headline?: boolean;
}) {
  return (
    <div>
      <span
        className={
          headline
            ? "mb-2.5 block whitespace-nowrap text-center text-base font-bold text-ws-teal"
            : "mb-1.5 block text-sm font-semibold text-ws-teal"
        }
      >
        {label}
      </span>
      {readOnly ? (
        <p className="whitespace-pre-wrap rounded-md border border-ws-line px-3 py-2 text-sm leading-relaxed text-ws-ink">
          {value}
        </p>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className="w-full resize-none rounded-md border border-ws-line px-3 py-2 text-sm leading-relaxed text-ws-ink outline-none placeholder:text-ws-muted/60 focus:border-ws-teal"
        />
      )}
    </div>
  );
}

export function WorkAlignment({
  value,
  onChange,
  readOnly = false,
}: {
  value: AlignmentData;
  onChange?: (next: AlignmentData) => void;
  readOnly?: boolean;
}) {
  const set = (patch: Partial<AlignmentData>) =>
    onChange?.({ ...value, ...patch });

  return (
    <div className="mt-5">
      {/* 上段：3コラムのタイトル＋入力。下のベン図（じぶん → 一致点 → 会社）と同じ並びにする */}
      <div className="grid grid-cols-3 items-start gap-8">
        {/* 左：じぶん（なぜ今の会社で働こうと思ったか） */}
        <Field
          label="なぜ今の会社で働こうと思った？"
          value={value.whyWork}
          placeholder={
            "なぜ他ではなく、この会社に？\nどんなことがやりたくて、この会社に？"
          }
          rows={8}
          readOnly={readOnly}
          onChange={(v) => set({ whyWork: v })}
          headline
        />

        {/* 中央：一致点（やりたいことと一致した点） */}
        <Field
          label="やりたいことと一致した点は？"
          value={value.achieve}
          placeholder={
            "ビジョン実現に向けて、何がしたい？\nミッション達成に向けて、自分の役割とは？\n何が実現できると、達成感を感じるのだろう？"
          }
          rows={8}
          readOnly={readOnly}
          onChange={(v) => set({ achieve: v })}
          headline
        />

        {/* 右：会社（会社の理念・ビジョン） */}
        <Field
          label="会社の理念・ビジョン"
          value={value.vision}
          placeholder={"経営ビジョンとは？\n会社のミッションとは？"}
          rows={8}
          readOnly={readOnly}
          onChange={(v) => set({ vision: v })}
          headline
        />
      </div>

      {/* 下段：ベン図（じぶん∩会社＝一致点）・中央寄せ */}
      <div className="mx-auto mt-1 w-[440px] max-w-full">
        <VennDiagram />
      </div>
    </div>
  );
}
