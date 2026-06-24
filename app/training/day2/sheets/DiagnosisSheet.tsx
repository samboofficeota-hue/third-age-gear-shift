"use client";

import { type ReactNode, useState } from "react";
import { PrintSheet } from "@/components/worksheet/PrintSheet";
import { SheetHeader } from "@/components/worksheet/SheetHeader";
import { RadarChart } from "@/components/worksheet/RadarChart";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  DIAGNOSIS_ITEMS,
  CIRCLED,
  SCORE_MAX,
  DIAGNOSIS_SECTIONS,
} from "../_constants";
import type { Diagnosis } from "../_types";

const SCALE_LABELS = [
  "まったく\nそう思わない",
  "あまり\nそう思わない",
  "やや\nそう思う",
  "とても\nそう思う",
];

const SCALE_NUM_COLORS = [
  "#9CA3AF",
  "#5EADAD",
  "#3D9494",
  "#1A7A7A",
] as const;

/**
 * #8 コミュニティ活動力 自己診断
 * 初期: 表のみ（評価列なし）＋「入力する」ボタン
 * 入力後: レーダーチャート＋スコア表 ＋「修正する」ボタン
 */
export function DiagnosisSheet({
  nameTag,
  diagnosis,
  viewOnly,
  onDiagnosisChange,
}: {
  nameTag: ReactNode;
  diagnosis: Diagnosis;
  viewOnly: boolean;
  onDiagnosisChange: (next: Diagnosis) => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const hasScores = DIAGNOSIS_ITEMS.some((it) => diagnosis[it.no] != null);

  const setAnswer = (id: string, value: string) =>
    setAnswers((prev) => ({ ...prev, [id]: value }));

  const computeAndClose = () => {
    const next: Diagnosis = {};
    for (const item of DIAGNOSIS_ITEMS) {
      const section = DIAGNOSIS_SECTIONS.find((s) => s.dimNo === item.no);
      if (!section) continue;
      const vals = section.questions
        .map((q) => {
          const v = answers[q.id];
          return v ? Number(v) : null;
        })
        .filter((x): x is number => x !== null);
      if (vals.length > 0) {
        const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
        next[item.no] = Math.round(avg * 10) / 10;
      }
    }
    onDiagnosisChange(next);
    setModalOpen(false);
  };

  return (
    <PrintSheet>
      <SheetHeader
        no={8}
        accent="コミュニティ活動力"
        title="〜 自己診断"
        right={nameTag}
      />
      <div className="mt-3 flex items-start justify-between gap-6">
        <p className="text-sm text-ws-muted">
          マイ・ポートフォリオを広げていくためには、自分のチカラを知るところから始めましょう。じぶんの10のチカラを調べてみましょう。
        </p>
        {!viewOnly && (
          <div className="no-print flex shrink-0 items-center">
            <Button
              onClick={() => setModalOpen(true)}
              className="rounded-full px-6 py-2 text-base font-bold"
            >
              {hasScores ? "修正する" : "入力する"}
            </Button>
          </div>
        )}
      </div>

      {hasScores ? (
        /* ── 入力済み: スコア表 + レーダーチャート ── */
        <div className="mt-4 flex items-center justify-center gap-16">
          <table className="shrink-0 border-collapse text-sm">
            <thead>
              <tr className="bg-ws-teal text-white">
                <th className="border border-ws-teal px-3 py-2 font-semibold">
                  大項目
                </th>
                <th className="border border-ws-teal px-3 py-2 font-semibold">
                  中項目
                </th>
                <th className="border border-ws-teal px-3 py-2 font-semibold">
                  スコア
                </th>
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
                    {diagnosis[it.no] != null
                      ? (diagnosis[it.no] as number).toFixed(1)
                      : "–"}
                    <span className="ml-0.5 text-xs font-normal text-ws-muted">
                      /4
                    </span>
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
              max={4}
              step={1}
            />
          </div>
        </div>
      ) : (
        /* ── 未入力: 表のみ（評価列なし） ── */
        <table className="mt-3 w-full border-collapse text-sm">
          <thead>
            <tr className="bg-ws-teal text-white">
              <th className="border border-ws-teal px-2 py-2 font-semibold">
                No
              </th>
              <th className="border border-ws-teal px-2 py-2 font-semibold">
                カテゴリー
              </th>
              <th className="border border-ws-teal px-2 py-2 font-semibold">
                活動力
              </th>
              <th className="border border-ws-teal px-3 py-2 text-left font-semibold">
                解説
              </th>
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
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ── 30問モーダル ── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto p-0 [&>button]:text-white [&>button]:hover:text-white/80 sm:max-w-2xl">
          <DialogHeader className="space-y-3 rounded-t-lg bg-ws-teal px-6 py-8 text-center">
            <DialogTitle className="text-xl font-bold text-white">
              コミュニティ活動力診断
            </DialogTitle>
            <DialogDescription className="mx-auto max-w-md text-sm leading-relaxed text-white/90">
              直感で回答してください。4段階で自分にあてはまるものを選びましょう。
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-5 px-5 pb-8 pt-5 sm:px-8">
            {DIAGNOSIS_SECTIONS.map((section) => (
              <section
                key={section.label}
                className="rounded-xl border border-ws-line bg-white p-5"
              >
                <span className="inline-block rounded-full bg-ws-mint px-3 py-1 text-xs font-bold tracking-wide text-ws-teal">
                  {section.label}
                </span>
                {section.title && (
                  <h3 className="mt-2 text-base font-bold text-ws-ink">
                    {section.title}
                  </h3>
                )}
                {section.legend && (
                  <p className="mt-1 text-xs text-ws-muted">{section.legend}</p>
                )}
                <div className="mt-1">
                  {section.questions.map((q, qi) => (
                    <fieldset
                      key={q.id}
                      className="border-t border-dashed border-ws-line py-4 first:border-t-0"
                    >
                      <legend className="sr-only">{q.text}</legend>
                      <p className="mb-3 text-sm font-semibold leading-relaxed text-ws-ink">
                        <span className="mr-1.5 font-bold text-ws-teal">
                          Q{section.startQ + qi}.
                        </span>
                        {q.text}
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {SCALE_LABELS.map((slabel, i) => {
                          const v = String(i + 1);
                          const selected = answers[q.id] === v;
                          return (
                            <label
                              key={v}
                              className={cn(
                                "flex min-h-[64px] cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-[1.5px] px-1 py-2 text-center text-[11px] leading-tight transition-colors",
                                selected
                                  ? "bg-ws-mint/60"
                                  : "border-ws-line bg-white text-ws-muted hover:border-ws-teal"
                              )}
                              style={
                                selected
                                  ? { borderColor: SCALE_NUM_COLORS[i] }
                                  : undefined
                              }
                            >
                              <input
                                type="radio"
                                name={q.id}
                                value={v}
                                checked={selected}
                                onChange={() => setAnswer(q.id, v)}
                                className="sr-only"
                              />
                              <span
                                className="text-base font-bold"
                                style={{
                                  color: selected
                                    ? SCALE_NUM_COLORS[i]
                                    : SCALE_NUM_COLORS[i],
                                }}
                              >
                                {v}
                              </span>
                              <span className="whitespace-pre-line">
                                {slabel}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </fieldset>
                  ))}
                </div>
              </section>
            ))}

            <div className="flex flex-col items-center gap-3 pb-2 pt-1 text-center">
              <Button
                onClick={computeAndClose}
                className="rounded-full px-12 py-3 text-base font-bold"
              >
                結果を見る →
              </Button>
              <p className="text-xs text-ws-muted">
                ※
                未回答の設問があっても結果は出せます。優劣を判定するものではありません。
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PrintSheet>
  );
}
