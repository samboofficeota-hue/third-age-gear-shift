"use client";

import type { ReactNode } from "react";
import { PrintSheet } from "@/components/worksheet/PrintSheet";
import { SheetHeader } from "@/components/worksheet/SheetHeader";
import { ActionBox } from "../_helpers";
import type { ActionPlan } from "../_types";

/**
 * #10 ポートフォリオ戦略 アクションプラン
 * 未来のマイ・ポートフォリオから対象を1つ選び、Why/With/What/So What を1枚で記入する。
 */
export function ActionPlanSheet({
  nameTag,
  actionPlan,
  viewOnly,
  onActionPlanChange,
}: {
  nameTag: ReactNode;
  actionPlan: ActionPlan;
  viewOnly: boolean;
  onActionPlanChange: (next: ActionPlan) => void;
}) {
  const set = (field: keyof ActionPlan, v: string) =>
    onActionPlanChange({ ...actionPlan, [field]: v });

  return (
    <PrintSheet>
      <SheetHeader
        no={12}
        accent="ポートフォリオ戦略"
        title="アクションプラン"
        right={nameTag}
      />
      <p className="mt-3 text-sm text-ws-muted">
        未来のマイポートフォリオの中から1つのコミュニティを選んで、具体的な「一歩目」づくりを考えてみよう
      </p>
      <div className="mt-5 flex items-center gap-3">
        <span className="shrink-0 text-base font-bold text-ws-ink">
          コミュニティ名：
        </span>
        <input
          readOnly={viewOnly}
          value={actionPlan.target}
          onChange={(e) => set("target", e.target.value)}
          placeholder="未来のポートフォリオから1つ"
          className="flex-1 rounded-md border border-ws-line px-3 py-2 text-base text-ws-ink outline-none placeholder:text-ws-muted/50 focus:border-ws-teal"
        />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-x-10 gap-y-4">
        <ActionBox
          readOnly={viewOnly}
          rows={4}
          label="#1 Why ― 何のために"
          value={actionPlan.why}
          onChange={(v) => set("why", v)}
          ph="ここに関わりたい目的や理由は？"
        />
        <ActionBox
          readOnly={viewOnly}
          rows={4}
          label="#3 What ― 何をやってみる"
          value={actionPlan.what}
          onChange={(v) => set("what", v)}
          ph="具体的にやってみたいこととは？"
        />
        <ActionBox
          readOnly={viewOnly}
          rows={4}
          label="#2 With ― 誰と一緒に"
          value={actionPlan.with}
          onChange={(v) => set("with", v)}
          ph="どんな人と一緒にやってみたい？"
        />
        <ActionBox
          readOnly={viewOnly}
          rows={4}
          label="#4 So What ― 結果どうなりたい"
          value={actionPlan.sowhat}
          onChange={(v) => set("sowhat", v)}
          ph="その結果、自分はどんな風になるのだろう？"
        />
      </div>
    </PrintSheet>
  );
}
