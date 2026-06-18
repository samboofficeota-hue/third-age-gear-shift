"use client";

/**
 * 会社とじぶんの一致点（じぶん分析）。
 * じぶん∩会社のVenn図（黄色の重なり＝一致点）＋会社のビジョン・ミッション＋
 * 「なぜ今の会社で働こうと思ったか」「今の会社で何を成し遂げたいか」の2つの問い。
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
            ? "mb-4 block text-center text-base font-bold text-ws-teal"
            : "mb-1.5 block text-sm font-semibold text-ws-teal"
        }
      >
        {label}
      </span>
      {readOnly ? (
        <p className="whitespace-pre-wrap rounded-md border border-ws-line px-3 py-2 text-base leading-relaxed text-ws-ink">
          {value}
        </p>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className="w-full resize-none rounded-md border border-ws-line px-3 py-2 text-base leading-relaxed text-ws-ink outline-none placeholder:text-ws-muted/60 focus:border-ws-teal"
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
    <div className="mt-6">
      {/* 上段：3コラムのタイトル＋入力（左右は同サイズ・中央小さめ） */}
      <div
        className="grid items-start gap-12"
        style={{ gridTemplateColumns: "1fr 0.7fr 1fr" }}
      >
        {/* 左：原点（なぜ今の会社で働こうと思ったか） */}
        <Field
          label="なぜ今の会社で働こうと思ったのか？"
          value={value.whyWork}
          placeholder={
            "なぜ他ではなく、この会社に？\nどんなことがやりたくて、この会社に？"
          }
          rows={11}
          readOnly={readOnly}
          onChange={(v) => set({ whyWork: v })}
          headline
        />

        {/* 中央：会社のビジョン・ミッション */}
        <Field
          label="会社のビジョン・ミッション"
          value={value.vision}
          placeholder={"経営ビジョンとは？\n会社のミッションとは？"}
          rows={6}
          readOnly={readOnly}
          onChange={(v) => set({ vision: v })}
          headline
        />

        {/* 右：実現したいこと */}
        <Field
          label="今の会社で何を成し遂げたいのか？"
          value={value.achieve}
          placeholder={
            "ビジョン実現に向けて、何がしたい？\nミッション達成に向けて、自分の役割とは？\n何が実現できると、達成感を感じるのだろう？"
          }
          rows={11}
          readOnly={readOnly}
          onChange={(v) => set({ achieve: v })}
          headline
        />
      </div>

      {/* 下段：ベン図（じぶん∩会社＝一致点）・中央寄せ */}
      <div className="mx-auto mt-2 w-[520px] max-w-full">
        <VennDiagram />
      </div>
    </div>
  );
}
