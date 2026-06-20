"use client";

import type { ReactNode } from "react";
import { PrintSheet } from "@/components/worksheet/PrintSheet";
import { SheetHeader } from "@/components/worksheet/SheetHeader";
import {
  CommunityPortfolio,
  type PortfolioCircle,
} from "@/components/worksheet/CommunityPortfolio";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MiniPortfolio } from "../_helpers";
import { MINI_W } from "../_constants";

/**
 * #8 マイ・ポートフォリオ 2.0→3.0
 * single ステップ: 現在 ↔ 未来 をトグル表示
 * compare ステップ: 並べてシフト記入
 */
export function PortfolioSheet({
  nameTag,
  step,
  which,
  current,
  future,
  year,
  shift,
  viewOnly,
  saved,
  saving,
  onStepChange,
  onWhichChange,
  onCurrentChange,
  onFutureChange,
  onYearChange,
  onShiftChange,
  onSave,
}: {
  nameTag: ReactNode;
  step: "single" | "compare";
  which: "current" | "future";
  current: PortfolioCircle[];
  future: PortfolioCircle[];
  year: string;
  shift: string;
  viewOnly: boolean;
  saved: boolean;
  saving: boolean;
  onStepChange: (next: "single" | "compare") => void;
  onWhichChange: (next: "current" | "future") => void;
  onCurrentChange: (next: PortfolioCircle[]) => void;
  onFutureChange: (next: PortfolioCircle[]) => void;
  onYearChange: (next: string) => void;
  onShiftChange: (next: string) => void;
  onSave: () => void;
}) {
  return (
    <PrintSheet>
      <SheetHeader
        no={8}
        accent="マイ・ポートフォリオ"
        title="戦略 2.0 → 3.0"
        right={nameTag}
      />
      <div className="mt-3 flex items-start justify-between gap-6">
        <p className="text-sm text-ws-muted">
          何に時間を費やしていきたいか。どんなポートフォリオを描きたいか。まずはドラフト案をつくろう。
        </p>
        <div className="no-print flex shrink-0 items-center gap-2">
          {step === "single" ? (
            <>
              {(["current", "future"] as const).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => onWhichChange(w)}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                    which === w
                      ? "border-ws-teal bg-ws-mint text-ws-teal"
                      : "border-ws-line text-ws-muted hover:text-ws-ink"
                  )}
                >
                  {w === "current" ? "現在" : "未来"}
                </button>
              ))}
              <Button
                onClick={() => onStepChange("compare")}
                className="rounded-full px-4"
              >
                次に進む →
              </Button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onStepChange("single")}
                className="rounded-full border border-ws-line px-4 py-1.5 text-sm font-medium text-ws-muted hover:text-ws-ink"
              >
                ← 前に戻る
              </button>
              {!viewOnly && saved && (
                <span className="text-sm font-medium text-ws-teal">
                  保存しました ✓
                </span>
              )}
              {!viewOnly && (
                <Button
                  onClick={onSave}
                  disabled={saving}
                  className="rounded-full px-5"
                >
                  {saving ? "保存中..." : "保存する"}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {step === "single" ? (
        which === "current" ? (
          <div>
            <p className="mt-5 inline-block rounded bg-ws-mint px-3 py-1 text-base font-bold text-ws-teal">
              現在（2026年）のマイ・ポートフォリオ ＝ Day1で作成
            </p>
            <CommunityPortfolio
              value={current}
              readOnly={viewOnly}
              onChange={onCurrentChange}
            />
          </div>
        ) : (
          <div>
            <div className="mt-5 flex items-center gap-3">
              <span className="inline-block rounded bg-ws-mint px-3 py-1 text-base font-bold text-ws-teal">
                未来のポートフォリオ ＝ これから描く
              </span>
              <span className="no-print inline-flex items-center gap-1 text-sm text-ws-muted">
                <input
                  readOnly={viewOnly}
                  value={year}
                  onChange={(e) => onYearChange(e.target.value)}
                  placeholder="20xx"
                  className="w-20 rounded-md border border-ws-line px-2 py-1 text-center text-ws-ink outline-none focus:border-ws-teal"
                />
                年
              </span>
            </div>
            <CommunityPortfolio
              value={future}
              readOnly={viewOnly}
              onChange={onFutureChange}
            />
          </div>
        )
      ) : (
        <div className="mt-5 mx-auto" style={{ width: MINI_W * 2 + 88 }}>
          {/* 現在 ／ 未来 を間隔をあけて並べて比較 */}
          <div className="flex justify-between">
            <MiniPortfolio label="現在" year="2026" value={current} />
            <MiniPortfolio label="未来" year={year} value={future} />
          </div>
          <p className="mt-8 text-center">
            <span className="inline-block rounded bg-ws-mint px-3 py-1 text-base font-bold text-ws-teal">
              シフト ＝ 現在から未来への移行ポイント
            </span>
          </p>
          <textarea
            readOnly={viewOnly}
            value={shift}
            onChange={(e) => onShiftChange(e.target.value)}
            rows={4}
            placeholder="現在から未来へ。何からシフトしていく？ どうシフトしていく？"
            className="mt-3 w-full resize-none rounded-md border border-ws-line px-3 py-2 text-base leading-relaxed text-ws-ink outline-none placeholder:text-ws-muted/50 focus:border-ws-teal"
          />
        </div>
      )}
    </PrintSheet>
  );
}
