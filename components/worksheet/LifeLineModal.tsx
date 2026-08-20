"use client";

import { useState } from "react";
import { LineChart, X } from "lucide-react";
import { LifeLineChart } from "./LifeLineChart";
import { sortedForChart, type LifeCurvePoint } from "@/app/workshop/pre/life-plan/_types";

/**
 * 「ライフラインチャートを振り返る」ボタン＋モーダル。
 * 事前課題（pre.lifeCurve）で記入した内容を、読み取り専用で振り返るためだけのもの
 * （編集はできない。編集は /workshop/pre/life-plan 側）。
 */
export function LifeLineModal({ points }: { points: LifeCurvePoint[] }) {
  const [open, setOpen] = useState(false);
  const plotted = sortedForChart(points);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mx-auto flex items-center gap-2 rounded-full border border-border bg-bg-panel px-5 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/50"
      >
        <LineChart className="h-4 w-4 text-primary" />
        ライフラインチャートを振り返る
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="text-base font-bold text-ws-ink">ライフラインチャート</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="閉じる"
                className="text-ws-muted hover:text-ws-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4">
              {plotted.length > 0 ? (
                <LifeLineChart points={plotted} />
              ) : (
                <p className="text-sm text-ws-muted">
                  まだライフラインチャートが記入されていません。
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
