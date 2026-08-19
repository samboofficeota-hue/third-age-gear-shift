"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * 穴埋め式シナリオのレンダラー。
 * mode="edit" … 空欄をボックス入力（自動で縦に伸びる）。
 * mode="display" … ボックスを消し、埋めた言葉を強調した「文章」として表示
 *   （保存後・記入例・印刷用）。長文は自動で折り返す。
 */

export type FillSegment =
  | { text: string }
  | { blank: string; w?: "sm" | "md" | "lg"; ph?: string };
export type FillTemplate = FillSegment[][]; // 行 × セグメント

const W: Record<string, string> = {
  sm: "w-24",
  md: "w-56",
  lg: "w-80",
};

/**
 * 表示モード（compact＝印刷用シート）の段階的な詰め方。
 * 記入量は人によって違うため、1100x710px の印刷シートに収まらないときだけ
 * 上から順に強めていく：①行間調整 → ②改行（行間）をさらに詰める → ③フォント縮小。
 */
const DISPLAY_COMPACT_LEVELS = [
  "space-y-2 text-xl leading-relaxed",
  "space-y-1 text-xl leading-snug",
  "space-y-0.5 text-xl leading-tight",
  "space-y-0.5 text-lg leading-tight",
] as const;
const PRINT_SHEET_TARGET_HEIGHT = 710;

/** 内容に応じて高さが伸びるインライン入力（箱に収まらない量は上下に広がる） */
function GrowInput({
  value,
  onChange,
  placeholder,
  widthClass,
  compact,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  widthClass: string;
  compact?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "mx-1 inline-block resize-none overflow-hidden rounded-md border-2 border-ws-accent/50 px-2 py-1 align-middle font-bold leading-snug text-ws-ink outline-none placeholder:text-base placeholder:font-normal placeholder:text-ws-muted/50 focus:border-ws-accent",
        compact ? "text-lg" : "text-xl",
        widthClass
      )}
    />
  );
}

export function FillBlankScenario({
  template,
  values,
  onChange,
  mode,
  compact = false,
}: {
  template: FillTemplate;
  values: Record<string, string>;
  onChange?: (next: Record<string, string>) => void;
  mode: "edit" | "display";
  /** 1シートの内容が多いとき、印刷の1ページ(1100x710)に収まりやすいよう行間・余白を詰める */
  compact?: boolean;
}) {
  const set = (k: string, v: string) => onChange?.({ ...values, [k]: v });
  const display = mode === "display";

  const rootRef = useRef<HTMLDivElement>(null);
  const [level, setLevel] = useState(0);

  // 印刷シート(1100x710px)に収まりきらないときだけ、段階的に詰めを強める。
  useLayoutEffect(() => {
    if (!display || !compact) return;
    const sheet = rootRef.current?.closest(".print-sheet") as HTMLElement | null;
    if (!sheet) return;
    if (
      sheet.getBoundingClientRect().height > PRINT_SHEET_TARGET_HEIGHT &&
      level < DISPLAY_COMPACT_LEVELS.length - 1
    ) {
      setLevel((l) => l + 1);
    }
  }, [display, compact, level, values, template]);

  return (
    <div
      ref={rootRef}
      className={cn(
        "mt-5 break-words pl-[2.2em] text-ws-ink",
        display
          ? compact
            ? DISPLAY_COMPACT_LEVELS[level]
            : "space-y-3 text-2xl leading-relaxed"
          : compact
            ? "space-y-3 text-lg leading-relaxed"
            : "space-y-5 text-xl leading-loose"
      )}
    >
      {template.map((line, li) => (
        <p key={li}>
          {line.map((seg, si) => {
            if ("text" in seg) return <span key={si}>{seg.text}</span>;
            const v = values[seg.blank] ?? "";
            if (display) {
              return v.trim() ? (
                <span key={si} className="mx-0.5 font-bold text-ws-accent">
                  {v}
                </span>
              ) : (
                <span
                  key={si}
                  className="mx-1 inline-block min-w-[4rem] border-b-2 border-ws-line align-bottom"
                >
                  &nbsp;
                </span>
              );
            }
            return (
              <GrowInput
                key={si}
                value={v}
                onChange={(nv) => set(seg.blank, nv)}
                placeholder={seg.ph}
                widthClass={W[seg.w ?? "md"]}
                compact={compact}
              />
            );
          })}
        </p>
      ))}
    </div>
  );
}
