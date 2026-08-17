"use client";

/**
 * 社会とじぶんの接点（じぶん分析）。
 * 中央に「社会→じぶん」の図（q6.png）を置き、左＝いま見えている接点／右＝いま見えていない接点を
 * それぞれ最大4つの固定枠で書き出す。
 */

export type SocialContactData = { have: string[]; missing: string[] };

const MAX = 4;

function padTo(items: string[], n: number): string[] {
  const arr = [...items];
  while (arr.length < n) arr.push("");
  return arr.slice(0, n);
}

function ContactColumn({
  heading,
  placeholder,
  items,
  onChange,
  readOnly,
}: {
  heading: React.ReactNode;
  placeholder: string;
  items: string[];
  onChange: (next: string[]) => void;
  readOnly: boolean;
}) {
  const entries = readOnly ? items.filter((s) => s.trim()) : padTo(items, MAX);

  return (
    <div>
      <p className="mb-2 text-sm font-bold text-ws-ink">{heading}</p>
      <div className="space-y-2">
        {entries.map((s, i) =>
          readOnly ? (
            <p
              key={i}
              className="min-h-[2.5rem] whitespace-pre-wrap rounded-md border-2 border-ws-teal/60 px-3 py-1.5 text-sm leading-snug text-ws-ink"
            >
              {s}
            </p>
          ) : (
            <textarea
              key={i}
              value={s}
              onChange={(e) =>
                onChange(entries.map((v, idx) => (idx === i ? e.target.value : v)))
              }
              rows={2}
              placeholder={i === 0 ? placeholder : ""}
              className="w-full resize-none rounded-md border-2 border-ws-teal/60 px-3 py-1.5 text-sm leading-snug text-ws-ink outline-none placeholder:font-normal placeholder:text-ws-muted/60 focus:border-ws-teal"
            />
          )
        )}
      </div>
    </div>
  );
}

export function SocialContact({
  value,
  onChange,
  readOnly = false,
}: {
  value: SocialContactData;
  onChange?: (next: SocialContactData) => void;
  readOnly?: boolean;
}) {
  const have = value.have ?? [];
  const missing = value.missing ?? [];

  return (
    <div className="mt-5 grid items-center gap-8" style={{ gridTemplateColumns: "1fr 200px 1fr" }}>
      <ContactColumn
        heading={
          <>
            いま<span className="text-ws-accent">見えている</span>接点
          </>
        }
        placeholder="どんな人たちとのどんな接点？"
        items={have}
        readOnly={readOnly}
        onChange={(next) => onChange?.({ have: next, missing })}
      />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/q6.png"
        alt="社会とじぶんの関係（社会の中の一部としてのじぶん）"
        className="mx-auto h-auto w-full max-w-[200px]"
      />

      <ContactColumn
        heading={
          <>
            いま<span className="text-ws-accent">見えていない</span>接点
          </>
        }
        placeholder="どんな人たちとのどんな接点？"
        items={missing}
        readOnly={readOnly}
        onChange={(next) => onChange?.({ have, missing: next })}
      />
    </div>
  );
}
