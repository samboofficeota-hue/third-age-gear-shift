"use client";

/**
 * じぶんと社会の接点（じぶん分析）。
 * 左＝増やしてみたい接点を2つの問いで書き出す（いまよりも関わりを増やしたい／あたらしく関わってみたい）。
 * 右＝社会・会社・じぶんの3つの円の図（public/shakai_setten.png）。
 * 保存データの形と旧データの扱いは lib/socialContact.ts。
 */

import { socialContactText, type SocialContactData } from "@/lib/socialContact";

export type { SocialContactData };

const PLACEHOLDER = "（どんな人が、何している場所）";

function ContactBox({
  lead,
  strong,
  value,
  onChange,
  readOnly,
}: {
  lead: string;
  strong: string;
  value: string;
  onChange: (v: string) => void;
  readOnly: boolean;
}) {
  return (
    <div>
      <p className="mb-2 leading-snug">
        <span className="block text-sm font-semibold text-ws-teal">{lead}</span>
        <span className="text-base font-bold">
          <span className="text-ws-accent">{strong}</span>
          <span className="text-ws-teal">接点</span>
        </span>
      </p>
      {readOnly ? (
        <p className="min-h-[8.5rem] whitespace-pre-wrap rounded-md border-2 border-ws-teal/60 px-3 py-2 text-sm leading-relaxed text-ws-ink">
          {value}
        </p>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={5}
          placeholder={PLACEHOLDER}
          className="w-full resize-none rounded-md border-2 border-ws-teal/60 px-3 py-2 text-sm leading-relaxed text-ws-ink outline-none placeholder:text-ws-muted/60 focus:border-ws-teal"
        />
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
  const { more, fresh } = socialContactText(value);
  const set = (patch: { more?: string; fresh?: string }) =>
    onChange?.({ ...value, more, fresh, ...patch });

  return (
    <div className="mt-5 grid items-center gap-10" style={{ gridTemplateColumns: "1fr 1.15fr" }}>
      <div className="space-y-6">
        <ContactBox
          lead="いまよりも"
          strong="関わりを増やしたい"
          value={more}
          readOnly={readOnly}
          onChange={(v) => set({ more: v })}
        />
        <ContactBox
          lead="あたらしく"
          strong="関わってみたい"
          value={fresh}
          readOnly={readOnly}
          onChange={(v) => set({ fresh: v })}
        />
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/shakai_setten.png"
        alt="社会・会社・じぶんの3つの円。じぶんと社会の重なりから、社会の側へ接点を広げていく"
        className="mx-auto h-auto w-full max-w-[480px]"
      />
    </div>
  );
}
