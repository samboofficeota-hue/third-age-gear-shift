"use client";

import { Fragment, useState, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { WcmBox, UpTriangle } from "../_helpers";
import { WCM_ROWS } from "../_constants";
import type { WCM, WcmMeta } from "../_types";

const COMPANY_TEMPLATE: FillTemplate = [
  [
    { text: "私は " },
    { blank: "age", w: "sm", ph: "歳" },
    { text: " 歳まで、この会社で走り切ると決めた。" },
  ],
  [
    { text: "自分自身は以前と変わらないつもりだが、" },
    { blank: "change", w: "md", ph: "どんな変化" },
    { text: " という変化は起きているだろう。" },
  ],
  [
    { text: "でも、私は " },
    { blank: "doit", w: "lg", ph: "やりきりたいこと" },
    { text: " をやりきりたい。" },
  ],
  [
    { text: "これは、" },
    { blank: "who", w: "md", ph: "誰" },
    { text: " の " },
    { blank: "challenge", w: "lg", ph: "課題" },
    { text: " という課題に応えるもの。" },
  ],
  [
    { text: "私の " },
    { blank: "power", w: "md", ph: "強み・力" },
    { text: " という力がいちばん活きてくるはずだ。" },
  ],
  [
    { blank: "endYear", w: "sm", ph: "年" },
    { text: " 年、私がこの会社での役割を終えるとき、" },
  ],
  [
    { text: "私は、" },
    { blank: "legacy", w: "md", ph: "何" },
    { text: " を " },
    { blank: "successor", w: "md", ph: "誰" },
    { text: " に託していく。" },
  ],
];

/**
 * #11 会社での Will/Can/Must 2.0 → 3.0
 * current ステップ: 左（いま）だけ表示
 * both ステップ: 左が「宿題：会社編のマイシナリオ」カードに入れ替わり、右（将来）に集中する
 */
export function WcmSheet({
  nameTag,
  wcmStep,
  wcmCurrent,
  wcmFuture,
  wcmMeta,
  viewOnly,
  companyScenario,
  onCompanyScenarioChange,
  onWcmStepChange,
  onWcmCurrentChange,
  onWcmFutureChange,
  onWcmMetaChange,
}: {
  nameTag: ReactNode;
  wcmStep: "current" | "both";
  wcmCurrent: WCM;
  wcmFuture: WCM;
  wcmMeta: WcmMeta;
  viewOnly: boolean;
  companyScenario: Record<string, string>;
  onCompanyScenarioChange: (next: Record<string, string>) => void;
  onWcmStepChange: (next: "current" | "both") => void;
  onWcmCurrentChange: (next: WCM) => void;
  onWcmFutureChange: (next: WCM) => void;
  onWcmMetaChange: (next: WcmMeta) => void;
}) {
  // シナリオ修正モーダル。宿題の編集ページへ遷移させず、ここで company/society を
  // 読み直して company だけ差し替え保存する（homeworkのPATCHは両方送る必要があるため society も保持）。
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editCompany, setEditCompany] = useState<Record<string, string>>({});
  const [editSociety, setEditSociety] = useState<Record<string, string>>({});

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
    setEditCompany(sc?.company ?? companyScenario);
    setEditSociety(sc?.society ?? {});
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
        onCompanyScenarioChange(editCompany);
        setEditOpen(false);
      }
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <PrintSheet>
      <SheetHeader
        no={14}
        accent="会社での Will/Can/Must"
        title="2.0 → 3.0"
        right={nameTag}
      />
      <p className="mt-3 text-sm text-ws-muted">
        WCMフレームを使って、じぶん戦略を組み立てていきます。WCM
        2.0そしてWCM 3.0の順で進めていきましょう
      </p>

      <div
        className="mt-4 grid items-start gap-x-4 gap-y-3"
        style={{ gridTemplateColumns: "minmax(0,1fr) 88px minmax(0,1fr)" }}
      >
        {/* ヘッダー行（左：いま の年齢バッジ、または会社編カード） */}
        {wcmStep === "current" ? (
          <div className="text-center">
            <span className="inline-flex items-center gap-1 rounded bg-[#FCEFA6] px-3 py-1.5 text-sm font-bold text-ws-ink">
              <input
                readOnly={viewOnly}
                value={wcmMeta.curYear}
                onChange={(e) =>
                  onWcmMetaChange({ ...wcmMeta, curYear: e.target.value })
                }
                className="w-14 rounded border border-ws-ink/20 bg-white px-1 text-center outline-none focus:border-ws-teal"
              />
              年・
              <input
                readOnly={viewOnly}
                value={wcmMeta.curAge}
                onChange={(e) =>
                  onWcmMetaChange({ ...wcmMeta, curAge: e.target.value })
                }
                className="w-10 rounded border border-ws-ink/20 bg-white px-1 text-center outline-none focus:border-ws-teal"
              />
              歳（いま）
            </span>
          </div>
        ) : (
          <div className="row-span-4 rounded-xl border border-ws-line bg-white p-4">
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="inline-block rounded-full bg-ws-mint px-3 py-1 text-xs font-bold tracking-wide text-ws-teal">
                宿題：会社編のマイシナリオ
              </p>
              {!viewOnly && (
                <button
                  type="button"
                  onClick={openEdit}
                  className="no-print shrink-0 rounded-full border border-ws-line px-3 py-1 text-xs font-medium text-ws-muted transition-colors hover:border-ws-teal hover:text-ws-teal"
                >
                  修正する
                </button>
              )}
            </div>
            <div className="[&>div]:!mt-2 [&>div]:!space-y-1 [&>div]:!pl-3 [&>div]:!text-[13px] [&>div]:!leading-snug">
              <FillBlankScenario
                template={COMPANY_TEMPLATE}
                values={companyScenario}
                mode="display"
              />
            </div>
          </div>
        )}
        <div />
        {wcmStep === "both" ? (
          <div className="text-center">
            <span className="inline-flex items-center gap-1 rounded bg-[#FCEFA6] px-3 py-1.5 text-sm font-bold text-ws-ink">
              <input
                readOnly={viewOnly}
                value={wcmMeta.futYear}
                onChange={(e) =>
                  onWcmMetaChange({ ...wcmMeta, futYear: e.target.value })
                }
                placeholder="20xx"
                className="w-14 rounded border border-ws-ink/20 bg-white px-1 text-center outline-none placeholder:text-ws-muted/50 focus:border-ws-teal"
              />
              年・
              <input
                readOnly={viewOnly}
                value={wcmMeta.futAge}
                onChange={(e) =>
                  onWcmMetaChange({ ...wcmMeta, futAge: e.target.value })
                }
                placeholder="XX"
                className="w-10 rounded border border-ws-ink/20 bg-white px-1 text-center outline-none placeholder:text-ws-muted/50 focus:border-ws-teal"
              />
              歳（将来）
            </span>
          </div>
        ) : (
          <div />
        )}

        {/* 各行（Will / Can / Must） */}
        {WCM_ROWS.map((row) => {
          const emph = row.key === "must";
          const showUp = wcmStep === "both" && row.key !== "will";
          return (
            <Fragment key={row.key}>
              {/* 左（いま）: both ステップでは会社編カードに置き換わるため非表示 */}
              {wcmStep === "current" && (
                <div>
                  <div className="mb-1.5">
                    <span className="text-base font-bold text-ws-teal">
                      {row.label}
                    </span>{" "}
                    <span className="text-xs text-ws-muted">{row.curSub}</span>
                  </div>
                  <WcmBox
                    readOnly={viewOnly}
                    value={wcmCurrent[row.key]}
                    onChange={(v) =>
                      onWcmCurrentChange({ ...wcmCurrent, [row.key]: v })
                    }
                  />
                </div>
              )}

              {/* 中央（Must 行に矢印 or 次へボタン） */}
              <div className="pt-6">
                {row.key === "must" &&
                  (wcmStep === "current" ? (
                    <div className="flex h-20 items-center justify-center">
                      <Button
                        onClick={() => onWcmStepChange("both")}
                        className="rounded-full px-3"
                      >
                        次へ →
                      </Button>
                    </div>
                  ) : (
                    <div className="flex h-20 items-center justify-center">
                      <ArrowRight className="h-8 w-8 text-ws-accent" />
                    </div>
                  ))}
              </div>

              {/* 右（将来） */}
              {wcmStep === "both" ? (
                <div className="relative">
                  {showUp && (
                    <div className="absolute -top-[20px] left-1/2 -translate-x-1/2">
                      <UpTriangle />
                    </div>
                  )}
                  <div className="mb-1.5">
                    <span
                      className={cn(
                        "text-base font-bold",
                        emph ? "text-ws-accent" : "text-ws-teal"
                      )}
                    >
                      {row.futLabel}
                    </span>{" "}
                    <span className="text-xs text-ws-muted">{row.futSub}</span>
                  </div>
                  <WcmBox
                    readOnly={viewOnly}
                    value={wcmFuture[row.key]}
                    onChange={(v) =>
                      onWcmFutureChange({ ...wcmFuture, [row.key]: v })
                    }
                    emph={emph}
                  />
                </div>
              ) : (
                <div />
              )}
            </Fragment>
          );
        })}
      </div>

      {/* ── 会社編シナリオ修正モーダル（宿題の編集ページへ遷移させず、ここで完結させる） ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto bg-white text-ws-ink sm:max-w-[722px]">
          <DialogHeader>
            <DialogTitle className="text-ws-ink">
              宿題：会社編のマイシナリオ
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
                template={COMPANY_TEMPLATE}
                values={editCompany}
                onChange={setEditCompany}
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
