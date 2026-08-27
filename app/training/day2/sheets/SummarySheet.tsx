"use client";

import type { ReactNode } from "react";
import { PrintSheet } from "@/components/worksheet/PrintSheet";
import { SheetHeader } from "@/components/worksheet/SheetHeader";
import { SUMMARY_ROWS } from "../_constants";
import type { Summary } from "../_types";

/**
 * #12 会社における 課題・目標・行動 設定 ＋ 締めシート
 * Must → Will → Issue → Flag → Start をひとつながりの文章として組み立てる。
 */
export function SummarySheet({
  nameTag,
  summary,
  viewOnly,
  onSummaryChange,
}: {
  nameTag: ReactNode;
  summary: Summary;
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
          {SUMMARY_ROWS.map((row) => (
            <div key={row.key} className="flex items-center gap-4">
              <span className="w-16 shrink-0 text-lg font-bold text-ws-teal">
                {row.label}
              </span>
              <span className="w-24 shrink-0 whitespace-pre-line text-right text-sm leading-snug text-ws-muted">
                {row.prompt}
              </span>
              <input
                readOnly={viewOnly}
                value={summary[row.key]}
                onChange={(e) =>
                  onSummaryChange({ ...summary, [row.key]: e.target.value })
                }
                placeholder={row.ph}
                className="h-16 flex-1 rounded-lg border-2 border-ws-teal/60 px-3 text-center text-base font-bold text-ws-ink outline-none placeholder:font-normal placeholder:text-ws-muted/50 focus:border-ws-teal"
              />
              <span className="w-28 shrink-0 text-sm text-ws-ink">
                {row.suffix}
              </span>
            </div>
          ))}
        </div>
      </PrintSheet>

      {/* 締めのシート */}
      <PrintSheet>
        <div className="flex min-h-[630px] flex-col items-center justify-center gap-5 text-center">
          <p className="text-3xl font-bold text-ws-teal">
            じぶん経営 戦略講座は以上となります。
          </p>
          <p className="text-3xl font-bold text-ws-teal">
            たくさんのワーク、おつかれさまでした。
          </p>
        </div>
      </PrintSheet>
    </>
  );
}
