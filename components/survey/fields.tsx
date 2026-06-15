"use client";

import { cn } from "@/lib/utils";

/**
 * アンケート用の設問プリミティブ（レスポンシブ）。
 * §A〜D の5段階、§D 単一選択、§E NPS・自由記述 などに使用。
 */

function QuestionFrame({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="rounded-lg border border-[rgba(0,255,136,0.2)] bg-[#141a2a] p-4">
      <legend className="px-1 text-sm font-semibold text-[#e0f0e8]">
        {label}
      </legend>
      {hint && <p className="mb-2 text-xs text-muted-foreground">{hint}</p>}
      <div className="mt-2">{children}</div>
    </fieldset>
  );
}

/** 5段階リッカート尺度（1=そう思わない 〜 5=そう思う） */
export function LikertScale({
  label,
  hint,
  value,
  onChange,
  min = 1,
  max = 5,
  minLabel = "そう思わない",
  maxLabel = "そう思う",
}: {
  label: string;
  hint?: string;
  value: number | null;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
}) {
  const options = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <QuestionFrame label={label} hint={hint}>
      <div className="flex flex-wrap gap-2">
        {options.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              "h-11 min-w-11 flex-1 rounded-md border text-sm font-semibold transition-colors",
              value === n
                ? "border-primary bg-primary text-primary-foreground"
                : "border-[rgba(0,255,136,0.25)] bg-[#0f1420] text-[#e0f0e8] hover:border-primary"
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </QuestionFrame>
  );
}

/** 単一選択（§D など） */
export function SingleChoice({
  label,
  hint,
  options,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  options: { value: string; label: string }[];
  value: string | null;
  onChange: (v: string) => void;
}) {
  return (
    <QuestionFrame label={label} hint={hint}>
      <div className="space-y-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "block w-full rounded-md border px-3 py-3 text-left text-sm transition-colors",
              value === o.value
                ? "border-primary bg-primary/10 text-[#e0f0e8]"
                : "border-[rgba(0,255,136,0.25)] bg-[#0f1420] text-[#e0f0e8] hover:border-primary"
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </QuestionFrame>
  );
}

/** 自由記述 */
export function SurveyTextArea({
  label,
  hint,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <QuestionFrame label={label} hint={hint}>
      <textarea
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full resize-none rounded-md border border-[rgba(0,255,136,0.25)] bg-[#0f1420] px-3 py-2 text-sm text-[#e0f0e8] outline-none focus:border-primary"
      />
    </QuestionFrame>
  );
}
