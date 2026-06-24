"use client";

import { useState, type ReactNode } from "react";
import { PrintSheet } from "@/components/worksheet/PrintSheet";
import { SheetHeader } from "@/components/worksheet/SheetHeader";
import { Button } from "@/components/ui/button";
import {
  FillBlankScenario,
  type FillTemplate,
} from "@/components/worksheet/FillBlankScenario";
import type { Backcast } from "../_types";

const SOCIETY_TEMPLATE: FillTemplate = [
  [
    { text: "2045年、" },
    { blank: "age", w: "sm", ph: "歳" },
    { text: " 歳の私は、今日も " },
    { blank: "activity", w: "md", ph: "活動" },
    { text: " に取り組んでいる。" },
  ],
  [
    { text: "会社員の頃、" },
    { blank: "issue", w: "lg", ph: "社会の課題" },
    { text: " という社会の課題を感じていた。" },
  ],
  [
    { text: "ただあの頃の私は、" },
    { blank: "excuse", w: "lg", ph: "言い訳・思い込み" },
    { text: " と思い、何もせずにいた。" },
  ],
  [{ text: "でも、やってみたら夢中になった。" }],
  [
    { text: "そして何より " },
    { blank: "fulfill", w: "lg", ph: "実感" },
    { text: " という実感がある。" },
  ],
  [
    { text: "私の " },
    { blank: "power", w: "md", ph: "強み・力" },
    { text: " という力が、" },
    { blank: "forWhom", w: "md", ph: "誰・何" },
    { text: " のために活かせている。" },
  ],
  [{ text: "もうちょっと早く始めておけばよかった。" }],
  [
    { text: "だから、2026年の私に伝えたい！「" },
    { blank: "message", w: "lg", ph: "メッセージ" },
    { text: "」だと。" },
  ],
];

const BACKCAST_QUESTIONS: {
  key: keyof Backcast;
  num: string;
  label: string;
  ph: string;
}[] = [
  {
    key: "issue",
    num: "#1",
    label: "未来と今を比べて課題は何だろう",
    ph: "2045年の未来と現在のギャップから見えてくる課題は？",
  },
  {
    key: "goal",
    num: "#2",
    label: "まずどこをゴールにする？",
    ph: "最初のマイルストーンとして目指すゴールは？",
  },
  {
    key: "firstStep",
    num: "#3",
    label: "そのために何からやってみる",
    ph: "まず自分ができる一歩目は？",
  },
];

/**
 * #10 社会における バックキャスト
 * 左: 宿題の「社会」未来シナリオ表示
 * 右: バックキャスト図解 → 入力画面（3つの問い）
 */
export function BackcastSheet({
  nameTag,
  societyScenario,
  backcast,
  viewOnly,
  onBackcastChange,
}: {
  nameTag: ReactNode;
  societyScenario: Record<string, string>;
  backcast: Backcast;
  viewOnly: boolean;
  onBackcastChange: (next: Backcast) => void;
}) {
  const [mode, setMode] = useState<"chart" | "input">("chart");

  const hasInput =
    backcast.issue.trim() || backcast.goal.trim() || backcast.firstStep.trim();

  const set = (key: keyof Backcast, v: string) =>
    onBackcastChange({ ...backcast, [key]: v });

  return (
    <PrintSheet>
      <SheetHeader
        no={10}
        accent="ポートフォリオ戦略"
        title="アクションプラン"
        right={nameTag}
      />

      <div className="mt-3 grid grid-cols-2 gap-6">
        {/* ── 左: 宿題の社会シナリオ ── */}
        <div className="rounded-xl border border-ws-line bg-white p-4">
          <p className="mb-1 inline-block rounded-full bg-ws-mint px-3 py-1 text-xs font-bold tracking-wide text-ws-teal">
            宿題：2045年の社会へのマイシナリオ
          </p>
          <div className="[&>div]:!mt-2 [&>div]:!space-y-1 [&>div]:!pl-3 [&>div]:!text-[16px] [&>div]:!leading-relaxed">
            <FillBlankScenario
              template={SOCIETY_TEMPLATE}
              values={societyScenario}
              mode="display"
            />
          </div>
        </div>

        {/* ── 右: チャート or 入力 ── */}
        <div className="flex flex-col">
          {mode === "chart" && !hasInput ? (
            <>
              {/* バックキャスト図解 */}
              <div className="flex flex-1 items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/backcast.png"
                  alt="バックキャスト図解"
                  className="h-auto w-full max-w-[400px]"
                />
              </div>
              <div className="mt-4 flex justify-center">
                <Button
                  onClick={() => setMode("input")}
                  className="rounded-full px-8 py-3 text-base"
                >
                  バックキャストする
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* 3つの問い */}
              <div className="flex flex-1 flex-col gap-7">
                {BACKCAST_QUESTIONS.map((q) => (
                  <div key={q.key}>
                    <label className="mb-2 flex items-center gap-2 text-base font-bold text-ws-ink">
                      <span className="rounded bg-[#FCEFA6] px-2.5 py-0.5 text-sm font-bold">
                        {q.num}
                      </span>
                      {q.label}
                    </label>
                    <textarea
                      readOnly={viewOnly}
                      value={backcast[q.key]}
                      onChange={(e) => set(q.key, e.target.value)}
                      rows={3}
                      placeholder={q.ph}
                      className="w-full resize-none rounded-md border border-ws-line px-3 py-2 text-base leading-relaxed text-ws-ink outline-none placeholder:text-ws-muted/50 focus:border-ws-teal"
                    />
                  </div>
                ))}
              </div>
              {!viewOnly && hasInput && (
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setMode("chart")}
                    className="rounded-full border border-ws-line px-4 py-1.5 text-sm font-medium text-ws-muted hover:text-ws-ink"
                  >
                    ← 図に戻る
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PrintSheet>
  );
}

