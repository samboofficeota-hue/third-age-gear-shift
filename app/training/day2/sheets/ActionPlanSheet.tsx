"use client";

import type { ReactNode } from "react";
import { PrintSheet } from "@/components/worksheet/PrintSheet";
import { SheetHeader } from "@/components/worksheet/SheetHeader";
import type { PortfolioCircle } from "@/components/worksheet/CommunityPortfolio";
import { Button } from "@/components/ui/button";
import { MiniPortfolio, ActionBox } from "../_helpers";
import type { ActionPlan, ActionTarget } from "../_types";

/**
 * #10 ポートフォリオ戦略 アクションプラン
 * select ステップ: 未来図から対象 A／B を選ぶ
 * entry ステップ: A／B それぞれの Why / With / What / So What を記入
 */
export function ActionPlanSheet({
  nameTag,
  apStep,
  actionPlan,
  future,
  year,
  viewOnly,
  onApStepChange,
  onActionPlanChange,
}: {
  nameTag: ReactNode;
  apStep: "select" | "entry";
  actionPlan: ActionPlan;
  future: PortfolioCircle[];
  year: string;
  viewOnly: boolean;
  onApStepChange: (next: "select" | "entry") => void;
  onActionPlanChange: (next: ActionPlan) => void;
}) {
  if (apStep === "select") {
    return (
      <PrintSheet>
        <SheetHeader
          no={10}
          accent="ポートフォリオ戦略"
          title="アクションプラン"
          right={nameTag}
        />
        <div className="mt-3 flex items-start justify-between gap-6">
          <p className="text-sm text-ws-muted">
            未来のマイ・ポートフォリオから、コミュニティを2つ選定して、具体的な「一歩目」づくりを考えていきましょう。
          </p>
          <Button
            onClick={() => onApStepChange("entry")}
            className="no-print shrink-0 rounded-full px-4"
          >
            次に進む →
          </Button>
        </div>
        <div className="mt-5 flex items-center gap-10">
          <div className="shrink-0">
            <MiniPortfolio label="未来" year={year} value={future} scale={0.92} />
          </div>
          <div className="flex-1 space-y-6">
            {(["A", "B"] as const).map((tk) => (
              <div key={tk}>
                <span className="mb-2 flex items-center gap-2 text-base font-bold text-ws-ink">
                  <span className="rounded bg-[#FCEFA6] px-2.5 py-0.5">
                    対象（{tk}）
                  </span>
                  <span className="text-sm font-normal text-ws-muted">
                    どのコミュニティ
                  </span>
                </span>
                <input
                  readOnly={viewOnly}
                  value={tk === "A" ? actionPlan.targetA : actionPlan.targetB}
                  onChange={(e) =>
                    onActionPlanChange({
                      ...actionPlan,
                      [tk === "A" ? "targetA" : "targetB"]: e.target.value,
                    })
                  }
                  placeholder="未来のポートフォリオから1つ"
                  className="w-full rounded-md border border-ws-line px-3 py-2 text-base text-ws-ink outline-none placeholder:text-ws-muted/50 focus:border-ws-teal"
                />
              </div>
            ))}
          </div>
        </div>
      </PrintSheet>
    );
  }

  return (
    <>
      <div className="no-print flex w-full max-w-[1123px] justify-end">
        <button
          type="button"
          onClick={() => onApStepChange("select")}
          className="rounded-full border border-ws-line px-4 py-1.5 text-sm font-medium text-ws-muted hover:text-ws-ink"
        >
          ← 対象の選定に戻る
        </button>
      </div>
      <TargetSheet
        tk="A"
        nameTag={nameTag}
        target={actionPlan.A}
        targetName={actionPlan.targetA}
        viewOnly={viewOnly}
        onTargetChange={(next) =>
          onActionPlanChange({ ...actionPlan, A: next })
        }
      />
      <TargetSheet
        tk="B"
        nameTag={nameTag}
        target={actionPlan.B}
        targetName={actionPlan.targetB}
        viewOnly={viewOnly}
        onTargetChange={(next) =>
          onActionPlanChange({ ...actionPlan, B: next })
        }
      />
    </>
  );
}

function TargetSheet({
  tk,
  nameTag,
  target,
  targetName,
  viewOnly,
  onTargetChange,
}: {
  tk: "A" | "B";
  nameTag: ReactNode;
  target: ActionTarget;
  targetName: string;
  viewOnly: boolean;
  onTargetChange: (next: ActionTarget) => void;
}) {
  const set = (field: keyof ActionTarget, v: string) =>
    onTargetChange({ ...target, [field]: v });

  return (
    <PrintSheet>
      <div className="pt-3">
        <SheetHeader
          no={10}
          accent="ポートフォリオ戦略"
          title="アクションプラン"
          right={nameTag}
        />
      </div>
      <div className="mt-10 flex items-center gap-3">
        <span className="rounded bg-[#FCEFA6] px-3 py-1 text-base font-bold text-ws-ink">
          対象（{tk}）
        </span>
        <span className="text-3xl font-bold text-ws-ink">
          {targetName || "（未選定）"}
        </span>
      </div>
      <div className="mt-10 grid grid-cols-2 gap-x-10 gap-y-8">
        <ActionBox
          readOnly={viewOnly}
          label="#1 Why ― 何のために"
          value={target.why}
          onChange={(v) => set("why", v)}
          ph="このコミュニティに関わる目的は？"
        />
        <ActionBox
          readOnly={viewOnly}
          label="#3 What ― 何をやってみる"
          value={target.what}
          onChange={(v) => set("what", v)}
          ph="具体的にやってみることは？"
        />
        <ActionBox
          readOnly={viewOnly}
          label="#2 With ― 誰と一緒に"
          value={target.with}
          onChange={(v) => set("with", v)}
          ph="誰と一緒にやる？"
        />
        <ActionBox
          readOnly={viewOnly}
          label="#4 So What ― 結果どうなりたい"
          value={target.sowhat}
          onChange={(v) => set("sowhat", v)}
          ph="その先、どうなっていたい？"
        />
      </div>
    </PrintSheet>
  );
}
