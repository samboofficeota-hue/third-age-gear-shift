"use client";

import type { ReactNode } from "react";
import { PrintSheet } from "@/components/worksheet/PrintSheet";
import { SheetHeader } from "@/components/worksheet/SheetHeader";
import { RadarChart } from "@/components/worksheet/RadarChart";
import { cn } from "@/lib/utils";
import { DIAGNOSIS_ITEMS, CIRCLED, SCORE_MAX } from "../_constants";
import type { Diagnosis } from "../_types";

/**
 * #9 コミュニティ活動力 自己診断
 * table = 表入力／chart = レーダーチャート表示
 */
export function DiagnosisSheet({
  nameTag,
  view,
  diagnosis,
  viewOnly,
  onViewChange,
  onDiagnosisChange,
}: {
  nameTag: ReactNode;
  view: "table" | "chart";
  diagnosis: Diagnosis;
  viewOnly: boolean;
  onViewChange: (next: "table" | "chart") => void;
  onDiagnosisChange: (next: Diagnosis) => void;
}) {
  return (
    <PrintSheet>
      <SheetHeader
        no={9}
        accent="コミュニティ活動力"
        title="〜 自己診断"
        right={nameTag}
      />
      <div className="mt-3 flex items-start justify-between gap-6">
        <p className="text-sm text-ws-muted">
          マイ・ポートフォリオを広げていくためには、自分のチカラを知るところから始めましょう。診断サイトの合計スコア（1〜10）を入力してください。
        </p>
        <div className="no-print flex shrink-0 items-center gap-1.5">
          {(["table", "chart"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onViewChange(v)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                view === v
                  ? "border-ws-teal bg-ws-mint text-ws-teal"
                  : "border-ws-line text-ws-muted hover:text-ws-ink"
              )}
            >
              {v === "table" ? "入力する" : "グラフで見る"}
            </button>
          ))}
        </div>
      </div>

      {view === "chart" ? (
        <div className="mt-4 flex items-center justify-center gap-16">
          <table className="shrink-0 border-collapse text-sm">
            <thead>
              <tr className="bg-ws-teal text-white">
                <th className="border border-ws-teal px-3 py-2 font-semibold">大項目</th>
                <th className="border border-ws-teal px-3 py-2 font-semibold">中項目</th>
                <th className="border border-ws-teal px-3 py-2 font-semibold">合計スコア</th>
              </tr>
            </thead>
            <tbody>
              {DIAGNOSIS_ITEMS.map((it) => (
                <tr key={it.no}>
                  {it.span > 0 && (
                    <td
                      rowSpan={it.span}
                      className="border border-ws-line px-3 py-1.5 text-center align-middle font-bold text-ws-ink"
                    >
                      {it.cat}
                    </td>
                  )}
                  <td className="border border-ws-line px-3 py-1.5 font-bold text-ws-ink">
                    {CIRCLED[it.no - 1]} {it.name}
                  </td>
                  <td className="border border-ws-line px-3 py-1.5 text-center text-base font-bold text-ws-teal">
                    {diagnosis[it.no] ?? "–"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="w-[470px] max-w-full">
            <RadarChart
              items={DIAGNOSIS_ITEMS.map((it) => ({
                label: `${CIRCLED[it.no - 1]} ${it.name}`,
                value: Number(diagnosis[it.no] ?? 0),
              }))}
              max={SCORE_MAX}
            />
          </div>
        </div>
      ) : (
        <table className="mt-3 w-full border-collapse text-sm">
          <thead>
            <tr className="bg-ws-teal text-white">
              <th className="border border-ws-teal px-2 py-2 font-semibold">No</th>
              <th className="border border-ws-teal px-2 py-2 font-semibold">
                カテゴリー
              </th>
              <th className="border border-ws-teal px-2 py-2 font-semibold">
                活動力
              </th>
              <th className="border border-ws-teal px-3 py-2 text-left font-semibold">
                解説
              </th>
              <th className="border border-ws-teal px-2 py-2 font-semibold">評価</th>
            </tr>
          </thead>
          <tbody>
            {DIAGNOSIS_ITEMS.map((it) => (
              <tr key={it.no}>
                <td className="border border-ws-line px-2 py-1.5 text-center text-ws-muted">
                  {it.no}
                </td>
                {it.span > 0 && (
                  <td
                    rowSpan={it.span}
                    className="border border-ws-line px-2 py-1.5 text-center align-middle font-bold text-ws-ink"
                  >
                    {it.cat}
                  </td>
                )}
                <td className="border border-ws-line px-2 py-1.5 text-center font-bold text-ws-teal">
                  {it.name}
                </td>
                <td className="border border-ws-line px-3 py-1.5 leading-snug text-ws-ink">
                  {it.desc}
                </td>
                <td className="border border-ws-line px-2 py-1.5 text-center">
                  <input
                    readOnly={viewOnly}
                    type="number"
                    min={1}
                    max={SCORE_MAX}
                    value={diagnosis[it.no] ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      const next = { ...diagnosis };
                      if (v === "") delete next[it.no];
                      else next[it.no] = Number(v);
                      onDiagnosisChange(next);
                    }}
                    placeholder="–"
                    className="w-16 rounded-md border border-ws-line px-2 py-1 text-center text-base font-bold text-ws-ink outline-none placeholder:font-normal placeholder:text-ws-muted/50 focus:border-ws-teal"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </PrintSheet>
  );
}
