"use client";

import type { ReactNode } from "react";
import { PrintSheet } from "@/components/worksheet/PrintSheet";
import { SheetHeader } from "@/components/worksheet/SheetHeader";
import { SUMMARY_ROWS } from "../_constants";
import type { Summary, WCM } from "../_types";
import { BRAND } from "@/lib/brand";

/**
 * #12 会社における 課題・目標・行動 設定 ＋ 締めシート
 * Must → Will → Issue → Flag → Start をひとつながりの文章として組み立てる。
 * Must・Will は #14 で書いた 3.0 をそのまま表示する（ここでは書き直さない）。
 */
export function SummarySheet({
  nameTag,
  summary,
  wcmFuture,
  viewOnly,
  onSummaryChange,
}: {
  nameTag: ReactNode;
  summary: Summary;
  wcmFuture: WCM;
  viewOnly: boolean;
  onSummaryChange: (next: Summary) => void;
}) {
  return (
    <>
      <PrintSheet>
        <SheetHeader
          no={15}
          accent="会社における"
          title="課題・目標・行動 設定"
          right={nameTag}
        />
        <p className="mt-3 text-sm text-ws-muted">
          本分（Must）から、ありたい姿（Will）・課題・目標・一歩目までを、ひとつながりの文章にしてみましょう。
        </p>
        <div className="mt-5 space-y-4">
          {SUMMARY_ROWS.map((row) => {
            const fromWcm = row.key === "must" || row.key === "will";
            return (
            <div key={row.key} className="flex items-center gap-4">
              <span className="w-16 shrink-0 text-lg font-bold text-ws-teal">
                {row.label}
              </span>
              <span className="w-24 shrink-0 whitespace-pre-line text-right text-sm leading-snug text-ws-muted">
                {row.prompt}
              </span>
              {fromWcm ? (
                <div className="flex min-h-16 flex-1 items-center justify-center whitespace-pre-line rounded-lg border-2 border-ws-teal/30 bg-ws-mint/50 px-3 py-2 text-center text-base font-bold leading-snug text-ws-ink">
                  {wcmFuture[row.key as "must" | "will"].trim() || (
                    <span className="text-sm font-normal text-ws-muted/60">
                      #14 の 3.0 の{row.label}が入ります
                    </span>
                  )}
                </div>
              ) : (
                <input
                  readOnly={viewOnly}
                  value={summary[row.key]}
                  onChange={(e) =>
                    onSummaryChange({ ...summary, [row.key]: e.target.value })
                  }
                  placeholder={row.ph}
                  className="h-16 flex-1 rounded-lg border-2 border-ws-teal/60 px-3 text-center text-base font-bold text-ws-ink outline-none placeholder:font-normal placeholder:text-ws-muted/50 focus:border-ws-teal"
                />
              )}
              <span className="w-28 shrink-0 text-sm text-ws-ink">
                {row.suffix}
              </span>
            </div>
            );
          })}
        </div>
      </PrintSheet>

      {/* 締めのシート */}
      <PrintSheet>
        <div className="flex min-h-[630px] flex-col items-center justify-center gap-5 text-center">
          <p className="text-3xl font-bold text-ws-teal">
            {BRAND.name}は以上となります。
          </p>
          <p className="text-3xl font-bold text-ws-teal">
            たくさんのワーク、おつかれさまでした。
          </p>
        </div>
      </PrintSheet>
    </>
  );
}
