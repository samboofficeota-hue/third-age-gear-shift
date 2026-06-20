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
    <div className="rounded-xl border border-[rgba(0,255,136,0.25)] bg-[#141a2a] p-5">
      <p className="text-[17px] font-semibold leading-relaxed text-[#e0f0e8]">
        {label}
      </p>
      {hint && <p className="mt-1.5 text-sm text-[#a0c0b0]">{hint}</p>}
      <div className="mt-4">{children}</div>
    </div>
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
  disabled = false,
}: {
  label: string;
  hint?: string;
  value: number | null;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
  disabled?: boolean;
}) {
  const options = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <QuestionFrame label={label} hint={hint}>
      <div className="flex flex-wrap gap-2">
        {options.map((n) => (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onChange(n)}
            className={cn(
              "h-14 min-w-14 flex-1 rounded-lg border-2 text-xl font-bold transition-colors",
              value === n
                ? "border-primary bg-primary text-primary-foreground"
                : "border-[rgba(0,255,136,0.3)] bg-[#0f1420] text-[#e0f0e8]",
              disabled ? "cursor-default opacity-90" : "hover:border-primary"
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-xs text-[#a0c0b0]">
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
  disabled = false,
}: {
  label: string;
  hint?: string;
  options: { value: string; label: string }[];
  value: string | null;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <QuestionFrame label={label} hint={hint}>
      <div className="space-y-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(o.value)}
            className={cn(
              "block w-full rounded-lg border px-4 py-3.5 text-left text-base leading-relaxed transition-colors",
              value === o.value
                ? "border-primary bg-primary/15 text-[#e0f0e8]"
                : "border-[rgba(0,255,136,0.25)] bg-[#0f1420] text-[#e0f0e8]",
              disabled ? "cursor-default opacity-90" : "hover:border-primary"
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </QuestionFrame>
  );
}

/** 複数選択（§D図5 求める支援 など） */
export function MultiChoice({
  label,
  hint,
  options,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  hint?: string;
  options: { value: string; label: string }[];
  value: string[];
  onChange: (v: string[]) => void;
  disabled?: boolean;
}) {
  const toggle = (v: string) => {
    if (disabled) return;
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  };
  return (
    <QuestionFrame label={label} hint={hint}>
      <div className="space-y-2">
        {options.map((o) => {
          const checked = value.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              disabled={disabled}
              onClick={() => toggle(o.value)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg border px-4 py-3.5 text-left text-base leading-relaxed transition-colors",
                checked
                  ? "border-primary bg-primary/15 text-[#e0f0e8]"
                  : "border-[rgba(0,255,136,0.25)] bg-[#0f1420] text-[#e0f0e8]",
                disabled ? "cursor-default opacity-90" : "hover:border-primary"
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 text-xs",
                  checked
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-[rgba(0,255,136,0.4)]"
                )}
              >
                {checked ? "✓" : ""}
              </span>
              {o.label}
            </button>
          );
        })}
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
  disabled = false,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}) {
  return (
    <QuestionFrame label={label} hint={hint}>
      <textarea
        rows={rows}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full resize-none rounded-lg border border-[rgba(0,255,136,0.25)] bg-[#0f1420] px-4 py-3 text-base leading-relaxed text-[#e0f0e8] outline-none focus:border-primary",
          disabled && "cursor-default opacity-90"
        )}
      />
    </QuestionFrame>
  );
}
