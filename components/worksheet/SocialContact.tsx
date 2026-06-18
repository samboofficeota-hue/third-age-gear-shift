"use client";

import { Plus, Trash2 } from "lucide-react";

/**
 * 社会とじぶんの接点（じぶん分析）。
 * 社会⊃じぶん⊃会社 の図（黄＝接点・×＝接点なし）＋
 * 「いま有る接点」「いま持てて無い接点」を、どんな社会との何の接点かで書き出す。
 */

export type SocialContactData = { have: string[]; missing: string[] };

const MAX = 4;
const MIN_VISIBLE = 2;

/**
 * じぶん（上）と社会（下）を横長楕円で縦に重ねた図。
 * 社会の方が横に長く、重なり（接点の帯）の中に黄色い点＝接点をプロット。
 */
function SocietyDiagram() {
  return (
    <svg
      viewBox="0 30 440 184"
      className="h-auto w-full"
      role="img"
      aria-label="じぶんと社会の接点（重なりに接点）"
    >
      {/* 社会（下・横に長い） */}
      <ellipse cx="220" cy="150" rx="185" ry="62" fill="#BFE0A0" />
      {/* じぶん（上・社会より小さめ） */}
      <ellipse cx="220" cy="84" rx="128" ry="46" fill="#F6C9D8" opacity="0.82" />
      {/* ラベル */}
      <text
        x="220"
        y="50"
        textAnchor="middle"
        className="fill-ws-ink"
        style={{ fontSize: 24, fontWeight: 700 }}
      >
        じぶん
      </text>
      <text
        x="220"
        y="190"
        textAnchor="middle"
        className="fill-ws-ink"
        style={{ fontSize: 24, fontWeight: 700, letterSpacing: 4 }}
      >
        社会
      </text>
    </svg>
  );
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
  const entries = readOnly
    ? items.filter((s) => s.trim())
    : items.length >= MIN_VISIBLE
    ? items
    : [...items, ...Array(MIN_VISIBLE - items.length).fill("")];
  const canAdd = !readOnly && entries.length < MAX;
  const canRemove = !readOnly && entries.length > MIN_VISIBLE;

  return (
    <div>
      <p className="mb-2 text-center text-base font-bold text-ws-ink">{heading}</p>
      <div className="space-y-3">
        {entries.map((s, i) => (
          <div key={i} className="relative">
            {readOnly ? (
              <p className="min-h-[3rem] whitespace-pre-wrap rounded-md border border-ws-line px-3 py-2 text-base leading-relaxed text-ws-ink">
                {s}
              </p>
            ) : (
              <>
                <textarea
                  value={s}
                  onChange={(e) =>
                    onChange(entries.map((v, idx) => (idx === i ? e.target.value : v)))
                  }
                  rows={2}
                  placeholder={i === 0 ? placeholder : ""}
                  className="w-full resize-none rounded-md border border-ws-line px-3 py-2 text-base leading-relaxed text-ws-ink outline-none placeholder:text-ws-muted/60 focus:border-ws-teal"
                />
                {canRemove && (
                  <button
                    type="button"
                    onClick={() => onChange(entries.filter((_, idx) => idx !== i))}
                    aria-label="削除"
                    className="no-print absolute right-1.5 top-1.5 text-ws-muted hover:text-ws-accent"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </>
            )}
          </div>
        ))}
      </div>
      {canAdd && (
        <button
          type="button"
          onClick={() => onChange([...entries, ""])}
          className="no-print mt-3 inline-flex items-center gap-2 text-sm text-ws-muted hover:text-ws-teal"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-dashed border-ws-teal text-ws-teal">
            <Plus className="h-3.5 w-3.5" />
          </span>
          接点を追加（最大{MAX}）
        </button>
      )}
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
    <div className="mt-6">
      {/* 上段：左＝いま有る接点／中央空き／右＝いま無い接点（前ページと同じ列幅） */}
      <div
        className="grid items-start gap-12"
        style={{ gridTemplateColumns: "1fr 0.7fr 1fr" }}
      >
        <ContactColumn
          heading={
            <>
              いま<span className="text-ws-accent">有る</span>接点
            </>
          }
          placeholder="どんな社会との、どんな接点？"
          items={have}
          readOnly={readOnly}
          onChange={(next) => onChange?.({ have: next, missing })}
        />
        <div aria-hidden />
        <ContactColumn
          heading={
            <>
              いま持てて<span className="text-ws-accent">無い</span>接点
            </>
          }
          placeholder="どんな社会との接点？"
          items={missing}
          readOnly={readOnly}
          onChange={(next) => onChange?.({ have, missing: next })}
        />
      </div>

      {/* 下段：じぶん×社会の図（一致点ページのVennと同じ位置・大きさ） */}
      <div className="mx-auto mt-2 w-[520px] max-w-full">
        <SocietyDiagram />
      </div>
    </div>
  );
}
