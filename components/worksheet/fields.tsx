"use client";

import { cn } from "@/lib/utils";

/**
 * ワークシート用の入力欄プリミティブ。
 * 枠線付きで、入力値はそのまま印刷（PDF）に出る。
 * Phase B で各ワークの実フィールドを組むときの基本部品。
 */

const baseField =
  "w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none transition-colors focus:border-emerald-500";

export function WorksheetTextField({
  label,
  value,
  onChange,
  placeholder,
  className,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      {label && (
        <span className="mb-1 block text-sm font-semibold text-stone-700">
          {label}
        </span>
      )}
      <input
        className={baseField}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function WorksheetTextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  className,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      {label && (
        <span className="mb-1 block text-sm font-semibold text-stone-700">
          {label}
        </span>
      )}
      <textarea
        rows={rows}
        className={cn(baseField, "resize-none leading-relaxed")}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
