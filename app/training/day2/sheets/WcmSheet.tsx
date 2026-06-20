"use client";

import { Fragment, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { PrintSheet } from "@/components/worksheet/PrintSheet";
import { SheetHeader } from "@/components/worksheet/SheetHeader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WcmBox, UpTriangle } from "../_helpers";
import { WCM_ROWS } from "../_constants";
import type { WCM, WcmMeta } from "../_types";

/**
 * #11 会社での Will/Can/Must 2.0 → 3.0
 * current ステップ: 左（いま）だけ表示
 * both ステップ: 左（いま） → 右（将来）の two-column
 */
export function WcmSheet({
  nameTag,
  wcmStep,
  wcmCurrent,
  wcmFuture,
  wcmMeta,
  viewOnly,
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
  onWcmStepChange: (next: "current" | "both") => void;
  onWcmCurrentChange: (next: WCM) => void;
  onWcmFutureChange: (next: WCM) => void;
  onWcmMetaChange: (next: WcmMeta) => void;
}) {
  return (
    <PrintSheet>
      <SheetHeader
        no={11}
        accent="会社での Will/Can/Must"
        title="2.0 → 3.0"
        right={nameTag}
      />
      <p className="mt-3 text-sm text-ws-muted">
        与件であった「MUST 義務」から、自分のための「MUST 本分」に書き換えていきましょう。
      </p>

      <div
        className="mt-5 grid items-start gap-x-4 gap-y-6"
        style={{ gridTemplateColumns: "minmax(0,1fr) 88px minmax(0,1fr)" }}
      >
        {/* ヘッダー行（左：いま） */}
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
              {/* 左（いま） */}
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

              {/* 中央（Must 行に矢印 or 次へボタン） */}
              <div className="pt-8">
                {row.key === "must" &&
                  (wcmStep === "current" ? (
                    <div className="flex h-32 items-center justify-center">
                      <Button
                        onClick={() => onWcmStepChange("both")}
                        className="rounded-full px-3"
                      >
                        次へ →
                      </Button>
                    </div>
                  ) : (
                    <div className="flex h-32 items-center justify-center">
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
    </PrintSheet>
  );
}
