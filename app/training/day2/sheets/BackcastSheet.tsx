"use client";

import { useState, type ReactNode } from "react";
import { PrintSheet } from "@/components/worksheet/PrintSheet";
import { SheetHeader } from "@/components/worksheet/SheetHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
 * 左: バックキャスト図解（常時表示・固定）
 * 右: 宿題の「社会」未来シナリオ ⇄ 3つの問い（バックキャストする で切り替え）
 */
export function BackcastSheet({
  nameTag,
  societyScenario,
  backcast,
  viewOnly,
  onBackcastChange,
  onSocietyScenarioChange,
}: {
  nameTag: ReactNode;
  societyScenario: Record<string, string>;
  backcast: Backcast;
  viewOnly: boolean;
  onBackcastChange: (next: Backcast) => void;
  onSocietyScenarioChange: (next: Record<string, string>) => void;
}) {
  // 初期表示だけ、既に回答済みなら入力側から始める。以降は完全にボタンで
  // トグルする単一の状態（バックキャストする ⇄ シナリオに戻る）。
  const [mode, setMode] = useState<"scenario" | "input">(() =>
    backcast.issue.trim() || backcast.goal.trim() || backcast.firstStep.trim()
      ? "input"
      : "scenario"
  );

  // シナリオ修正モーダル。同じ画面内で編集を完結させるため、宿題の編集ページへ
  // 遷移させず、ここで company/society を読み直して society だけ差し替え保存する
  // （homeworkのPATCHはcompany/society両方を送る必要があるため、companyも一緒に保持）。
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editSociety, setEditSociety] = useState<Record<string, string>>({});
  const [editCompany, setEditCompany] = useState<Record<string, string>>({});

  const showInput = mode === "input";

  const set = (key: keyof Backcast, v: string) =>
    onBackcastChange({ ...backcast, [key]: v });

  const openEdit = async () => {
    setEditOpen(true);
    setEditLoading(true);
    const d = await fetch("/api/workshop/me", {
      credentials: "include",
      cache: "no-store",
    })
      .then((r) => r.json())
      .catch(() => ({}));
    const sc = d?.workshopData?.homework?.scenario as
      | { company?: Record<string, string>; society?: Record<string, string> }
      | undefined;
    setEditCompany(sc?.company ?? {});
    setEditSociety(sc?.society ?? societyScenario);
    setEditLoading(false);
  };

  const saveEdit = async () => {
    setEditSaving(true);
    try {
      const res = await fetch("/api/workshop/me/homework", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          scenario: { company: editCompany, society: editSociety },
        }),
      });
      if (res.ok) {
        onSocietyScenarioChange(editSociety);
        setEditOpen(false);
      }
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <PrintSheet>
      <SheetHeader
        no={13}
        accent="未来の社会"
        title="をつくる第一歩"
        right={nameTag}
      />

      <div className="mt-3 grid grid-cols-2 gap-6">
        {/* ── 左: バックキャスト図解（常時表示） ── */}
        <div className="flex flex-col">
          <div className="flex flex-1 items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/backcast.png"
              alt="バックキャスト図解"
              className="h-auto w-full max-w-[400px]"
            />
          </div>
          <div className="mt-4 flex justify-center gap-3">
            <Button
              onClick={() => setMode(mode === "input" ? "scenario" : "input")}
              className="h-9 rounded-full px-5 text-sm"
            >
              {mode === "input" ? "シナリオに戻る" : "バックキャストする"}
            </Button>
            {!viewOnly && (
              <button
                type="button"
                onClick={openEdit}
                className="no-print inline-flex h-9 items-center justify-center rounded-full border border-ws-line px-5 text-sm font-medium text-ws-muted transition-colors hover:border-ws-teal hover:text-ws-teal"
              >
                シナリオ修正する
              </button>
            )}
          </div>
        </div>

        {/* ── 右: 宿題の社会シナリオ ⇄ 3つの問い ── */}
        <div className="flex flex-col">
          {!showInput ? (
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
          ) : (
            <>
              {/* 3つの問い */}
              <div className="flex flex-1 flex-col gap-3">
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
            </>
          )}
        </div>
      </div>

      {/* ── シナリオ修正モーダル（宿題の編集ページへ遷移させず、ここで完結させる） ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="ws-light-modal max-h-[90vh] overflow-y-auto bg-white text-ws-ink sm:max-w-[722px]">
          <DialogHeader>
            <DialogTitle className="text-ws-ink">
              宿題：2045年の社会へのマイシナリオ
            </DialogTitle>
            <DialogDescription>
              妄想でOK。空欄を埋めて更新しよう。
            </DialogDescription>
          </DialogHeader>
          {editLoading ? (
            <p className="py-8 text-center text-sm text-ws-muted">
              読み込み中...
            </p>
          ) : (
            <>
              <FillBlankScenario
                template={SOCIETY_TEMPLATE}
                values={editSociety}
                onChange={setEditSociety}
                mode="edit"
                compact
              />
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="rounded-full border border-ws-line px-4 py-2 text-sm text-ws-muted hover:text-ws-ink"
                >
                  キャンセル
                </button>
                <Button
                  onClick={saveEdit}
                  disabled={editSaving}
                  className="rounded-full px-6"
                >
                  {editSaving ? "保存中..." : "保存する"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PrintSheet>
  );
}

