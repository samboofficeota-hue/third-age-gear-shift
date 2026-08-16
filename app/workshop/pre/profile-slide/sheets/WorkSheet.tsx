"use client";

import type { ReactNode } from "react";
import { PrintSheet } from "@/components/worksheet/PrintSheet";
import { SheetHeader } from "@/components/worksheet/SheetHeader";
import { WORK_FIELDS, WORK_QUESTIONS } from "../_constants";
import type { Slide, Work } from "../_types";

/** ③今の会社・今の仕事（会社名／部署／肩書きと 3 つの問い） */
export function WorkSheet({
  nameTag,
  view,
  data,
  isSample,
  onSetWork,
}: {
  nameTag: ReactNode;
  view: Slide;
  data: Slide;
  isSample: boolean;
  onSetWork: (key: keyof Work, v: string) => void;
}) {
  return (
    <PrintSheet>
      <SheetHeader
        no={1}
        accent="じぶん"
        title="紹介"
        sub="〜 今の会社・今の仕事"
        right={nameTag}
      />

      <div className="mt-5 flex flex-col">
        {/* 会社名 / 部署名 / 肩書き */}
        <div className="grid grid-cols-3 gap-7">
          {WORK_FIELDS.map(({ key, label }) => {
            const ph =
              key === "title"
                ? "例）部長・〇〇リーダー・プロデューサー"
                : label;
            return (
              <div key={key}>
                <span className="mb-3 block text-sm font-semibold text-ws-teal">
                  {label}
                </span>
                {isSample ? (
                  <p className="min-h-[5rem] whitespace-pre-wrap text-2xl font-bold leading-snug text-ws-ink">
                    {view.work?.[key] || "　"}
                  </p>
                ) : (
                  <textarea
                    value={data.work?.[key] ?? ""}
                    onChange={(e) => onSetWork(key, e.target.value)}
                    placeholder={ph}
                    rows={2}
                    className="w-full resize-none rounded-md border border-ws-line px-3 py-2 text-xl font-bold leading-snug text-ws-ink outline-none placeholder:font-normal placeholder:text-ws-muted/70 focus:border-ws-teal"
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* 3 つの問い（3 カラム）。入力は1つのテキストボックス、表示は箇条書き。 */}
        <div className="mt-8 grid flex-1 grid-cols-3 divide-x divide-ws-line">
          {WORK_QUESTIONS.map(({ key, title, q }) => {
            const sampleLines = (view.work?.[key] ?? "")
              .split("\n")
              .filter((l) => l.trim());
            return (
              <div key={key} className="flex flex-col px-6 first:pl-0 last:pr-0">
                <p className="text-lg font-bold text-ws-teal">{title}</p>
                {isSample ? (
                  <ul className="mt-5 space-y-2">
                    {sampleLines.map((line, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1 shrink-0 text-ws-teal">・</span>
                        <span className="text-xl leading-relaxed text-ws-ink">
                          {line}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <textarea
                    value={data.work?.[key] ?? ""}
                    onChange={(e) => onSetWork(key, e.target.value)}
                    placeholder={q.join("\n")}
                    className="mt-5 w-full flex-1 resize-none rounded-md border border-transparent bg-transparent text-xl leading-relaxed text-ws-ink outline-none placeholder:text-ws-muted/70 focus:border-ws-teal"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </PrintSheet>
  );
}
