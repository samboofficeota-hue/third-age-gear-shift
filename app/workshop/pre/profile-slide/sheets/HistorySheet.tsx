"use client";

import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { PrintSheet } from "@/components/worksheet/PrintSheet";
import { SheetHeader } from "@/components/worksheet/SheetHeader";
import { HIST_PH, HIST_PH_FALLBACK } from "../_constants";
import type { HistRow } from "../_types";

/** ②生い立ち（縦タイムライン） */
export function HistorySheet({
  nameTag,
  rows,
  isSample,
  onSetHist,
  onAddRow,
}: {
  nameTag: ReactNode;
  rows: HistRow[];
  isSample: boolean;
  onSetHist: (i: number, key: keyof HistRow, v: string) => void;
  onAddRow: () => void;
}) {
  return (
    <PrintSheet>
      <SheetHeader
        no={1}
        accent="じぶん"
        title="紹介"
        sub="〜 生い立ち"
        right={nameTag}
      />

      <p className="mt-3 text-sm text-ws-muted">
        どんな環境で、どんな経歴を歩んできたか。年表でも文章でもOK。
        <span className="text-ws-teal">生年は記入なしでもOKです。</span>
      </p>

      <ul className="mt-7">
        {rows.map((r, i) => {
          const isLast = i === rows.length - 1;
          const ph = HIST_PH[i] ?? HIST_PH_FALLBACK;
          return (
            <li key={i} className="flex items-stretch gap-5">
              <div className="w-24 shrink-0 pt-1.5 text-right">
                {isSample ? (
                  <span className="text-xl font-bold text-ws-teal">{r.year}</span>
                ) : (
                  <input
                    value={r.year}
                    onChange={(e) => onSetHist(i, "year", e.target.value)}
                    placeholder={ph.year}
                    maxLength={9}
                    className="w-full rounded-md border border-ws-line px-2 py-1.5 text-right text-lg font-bold text-ws-teal outline-none focus:border-ws-teal"
                  />
                )}
              </div>
              <div className="flex w-4 shrink-0 flex-col items-center pt-2.5">
                <span className="h-3.5 w-3.5 shrink-0 rounded-full bg-ws-teal" />
                {!isLast && <span className="w-0.5 flex-1 bg-ws-line" />}
              </div>
              <div className="flex-1 pb-7">
                {isSample ? (
                  <p className="pt-1 text-xl text-ws-ink">{r.event}</p>
                ) : (
                  <input
                    value={r.event}
                    onChange={(e) => onSetHist(i, "event", e.target.value)}
                    placeholder={ph.event}
                    className="w-full rounded-md border border-ws-line px-3 py-2 text-lg text-ws-ink outline-none focus:border-ws-teal"
                  />
                )}
              </div>
            </li>
          );
        })}

        {!isSample && (
          <li className="no-print flex gap-5">
            <div className="w-24 shrink-0" />
            <div className="flex w-4 shrink-0 justify-center">
              <button
                type="button"
                onClick={onAddRow}
                aria-label="行を追加"
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-dashed border-ws-line text-ws-muted hover:border-ws-teal hover:text-ws-teal"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <span className="pt-1 text-sm text-ws-muted">行を追加</span>
          </li>
        )}
      </ul>
    </PrintSheet>
  );
}
