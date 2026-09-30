"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PhaseId } from "@/lib/phases";

export type FlowStepData = {
  id: PhaseId;
  /** 箱に出すラベル（例: "DAY 1"） */
  label: string;
  /** ラベル下の小さな日付（例: "10/17(土)"）。無ければ null */
  sub: string | null;
  /** 遷移先。開いているときだけ使う */
  href: string;
  state: "done" | "current" | "upcoming";
  /** クリックで入れるか（＝そのフェーズが OPEN か / pre は常時可） */
  accessible: boolean;
  /** 閉じている箱を押したときに出すメッセージ */
  lockedNote: string;
};

/**
 * ガイドの5フェーズのフロー図。各箱はクリックできる。
 * - 開いている（accessible）箱 → そのフェーズへ遷移
 * - 閉じている箱 → 遷移せず「まだ開けません」等のメッセージを表示
 */
export function PhaseFlow({ steps }: { steps: FlowStepData[] }) {
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <div>
      <div className="flex items-center justify-center gap-1.5 sm:gap-2.5">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center gap-1.5 sm:gap-2.5">
            {s.accessible ? (
              <Link
                href={s.href}
                onClick={() => setNotice(null)}
                aria-label={`${s.label}へ進む`}
              >
                <FlowStep step={s} />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setNotice(s.lockedNote)}
                aria-label={`${s.label}（まだ開けません）`}
              >
                <FlowStep step={s} />
              </button>
            )}
            {i < steps.length - 1 && (
              <ArrowRight
                strokeWidth={3}
                className="h-4 w-4 shrink-0 text-secondary-foreground sm:h-6 sm:w-6"
              />
            )}
          </div>
        ))}
      </div>

      {notice && (
        <p
          role="status"
          className="mt-4 text-center text-sm font-medium text-muted-foreground"
        >
          {notice}
        </p>
      )}
    </div>
  );
}

function FlowStep({ step }: { step: FlowStepData }) {
  const { label, sub, state, accessible } = step;
  return (
    <div
      className={cn(
        "relative flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border-2 text-center transition sm:h-24 sm:w-[6.5rem]",
        state === "current"
          ? "border-primary bg-primary/10 shadow-neon-glow"
          : state === "done"
            ? "border-primary/30 bg-card"
            : "border-border bg-card",
        accessible
          ? "cursor-pointer hover:border-primary hover:bg-primary/5"
          : "cursor-not-allowed opacity-70"
      )}
    >
      {/* 上段・ラベル・下段の3段を常に同じ高さで確保し、箱ごとにラベルの高さがずれないようにする */}
      <span className="flex h-3.5 items-center justify-center sm:h-4">
        {state === "current" ? (
          <span className="text-[10px] font-bold uppercase leading-none tracking-wide text-primary sm:text-xs">
            今ここ
          </span>
        ) : state === "done" ? (
          <Check className="h-3.5 w-3.5 text-primary/70" />
        ) : null}
      </span>
      <span
        className={cn(
          "text-xs font-bold leading-tight sm:text-base",
          state === "current"
            ? "text-primary"
            : state === "done"
              ? "text-secondary-foreground"
              : "text-muted-foreground"
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "flex h-3 items-center text-[9px] font-semibold leading-none sm:h-4 sm:text-xs",
          state === "upcoming" ? "text-muted-foreground" : "text-primary/80"
        )}
      >
        {sub}
      </span>
      {!accessible && (
        <Lock className="absolute right-1.5 top-1.5 h-3 w-3 text-muted-foreground sm:h-3.5 sm:w-3.5" />
      )}
    </div>
  );
}
