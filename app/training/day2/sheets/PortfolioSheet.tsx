"use client";

import { type ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { PrintSheet } from "@/components/worksheet/PrintSheet";
import { SheetHeader } from "@/components/worksheet/SheetHeader";
import {
  CommunityPortfolio,
  type PortfolioCircle,
} from "@/components/worksheet/CommunityPortfolio";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MINI_W, MINI_SCALE } from "../_constants";

/**
 * 比較ステップの「現在」枠。データは常に current（Day1由来）にあるが、
 * 押すまでは表示しない＝「読み込む」を明示アクションにする設計。
 * 読み込み後はマウスオーバーで「修正する」を出し、single ステップの編集へ導く。
 * loaded は Day2Client 側で保持（single↔compare を行き来しても、
 * このコンポーネント自体は compare 復帰のたびに再マウントされるため、
 * ここでローカル state にすると毎回リセットされてしまう）。
 */
function CurrentSlot({
  value,
  viewOnly,
  loaded,
  onLoad,
  onEdit,
}: {
  value: PortfolioCircle[];
  viewOnly: boolean;
  loaded: boolean;
  onLoad: () => void;
  onEdit: () => void;
}) {
  const w = MINI_W;
  const h = Math.round(430 * MINI_SCALE) + 4;

  return (
    <div style={{ width: w }}>
      <p className="mb-1 text-center text-sm font-bold text-ws-teal">現在</p>
      {!loaded ? (
        <div
          className="flex items-center justify-center rounded-xl border-2 border-dashed border-ws-line"
          style={{ width: w, height: h }}
        >
          <button
            type="button"
            onClick={onLoad}
            className="no-print rounded-full border border-ws-line px-4 py-1.5 text-xs font-medium text-ws-muted transition-colors hover:border-ws-teal hover:text-ws-teal"
          >
            マイポートフォリオを読み込む
          </button>
        </div>
      ) : (
        <div className="group relative" style={{ width: w, height: h }}>
          <div style={{ width: w, height: h, overflow: "hidden" }}>
            <div
              style={{
                transform: `scale(${MINI_SCALE})`,
                transformOrigin: "top left",
                width: 660,
              }}
            >
              <div className="-mt-6">
                <CommunityPortfolio
                  value={value}
                  readOnly
                  hideQuadrantLabels
                  titleFontScale={12 / 11 / MINI_SCALE}
                  allowLabelOverflow
                />
              </div>
            </div>
          </div>
          {!viewOnly && (
            <button
              type="button"
              onClick={onEdit}
              className="no-print absolute inset-0 flex items-center justify-center rounded-xl opacity-0 transition-opacity group-hover:bg-white/80 group-hover:opacity-100"
            >
              <span className="rounded-full border border-ws-teal bg-white px-4 py-1.5 text-xs font-bold text-ws-teal shadow-sm">
                修正する
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * 比較ステップの「未来」枠。current と違いデータが最初から存在しないので、
 * 空のときは「作成する」ボタンで single ステップの編集へ直接誘導する。
 * 一度でも作成済み（circle が1つ以上）なら、current と同じくマウスオーバーで「修正する」を出す。
 */
function FutureSlot({
  value,
  viewOnly,
  onEdit,
}: {
  value: PortfolioCircle[];
  viewOnly: boolean;
  onEdit: () => void;
}) {
  const w = MINI_W;
  const h = Math.round(430 * MINI_SCALE) + 4;
  const hasData = value.length > 0;

  return (
    <div style={{ width: w }}>
      <p className="mb-1 text-center text-sm font-bold text-ws-teal">未来</p>
      {!hasData ? (
        <div
          className="flex items-center justify-center rounded-xl border-2 border-dashed border-ws-line"
          style={{ width: w, height: h }}
        >
          {!viewOnly && (
            <button
              type="button"
              onClick={onEdit}
              className="no-print rounded-full border border-ws-line px-4 py-1.5 text-xs font-medium text-ws-muted transition-colors hover:border-ws-teal hover:text-ws-teal"
            >
              未来を作成する
            </button>
          )}
        </div>
      ) : (
        <div className="group relative" style={{ width: w, height: h }}>
          <div style={{ width: w, height: h, overflow: "hidden" }}>
            <div
              style={{
                transform: `scale(${MINI_SCALE})`,
                transformOrigin: "top left",
                width: 660,
              }}
            >
              <div className="-mt-6">
                <CommunityPortfolio
                  value={value}
                  readOnly
                  hideQuadrantLabels
                  titleFontScale={12 / 11 / MINI_SCALE}
                  allowLabelOverflow
                />
              </div>
            </div>
          </div>
          {!viewOnly && (
            <button
              type="button"
              onClick={onEdit}
              className="no-print absolute inset-0 flex items-center justify-center rounded-xl opacity-0 transition-opacity group-hover:bg-white/80 group-hover:opacity-100"
            >
              <span className="rounded-full border border-ws-teal bg-white px-4 py-1.5 text-xs font-bold text-ws-teal shadow-sm">
                修正する
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * #9 マイ・ポートフォリオ 2.0→3.0
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
  currentLoaded,
  onCurrentLoadedChange,
  onStepChange,
  onWhichChange,
  onCurrentChange,
  onFutureChange,
  onYearChange,
  onShiftItemChange,
  onShiftAdd,
  onSave,
}: {
  nameTag: ReactNode;
  step: "single" | "compare";
  which: "current" | "future";
  current: PortfolioCircle[];
  future: PortfolioCircle[];
  year: string;
  shift: string[];
  viewOnly: boolean;
  saved: boolean;
  saving: boolean;
  currentLoaded: boolean;
  onCurrentLoadedChange: (next: boolean) => void;
  onStepChange: (next: "single" | "compare") => void;
  onWhichChange: (next: "current" | "future") => void;
  onCurrentChange: (next: PortfolioCircle[]) => void;
  onFutureChange: (next: PortfolioCircle[]) => void;
  onYearChange: (next: string) => void;
  onShiftItemChange: (i: number, next: string) => void;
  onShiftAdd: () => void;
  onSave: () => void;
}) {
  const stepButtons = (
    <div className="no-print flex shrink-0 items-center gap-2">
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
        ← 前に戻る
      </Button>
    </div>
  );

  // シフトポイントのボックスは固定幅。最大4箱＋追加ボタンが並んでも
  // 比較行と同じコンテナ幅（948px）に収まり、折り返して710px規定を超えないサイズ。
  const shiftShowAddButton = !viewOnly && shift.length < 4;
  const SHIFT_BOX_W = 220;

  return (
    <PrintSheet>
      <SheetHeader
        no={11}
        accent="マイ・ポートフォリオ"
        title="戦略 2.0 → 3.0"
        right={nameTag}
      />
      <p className="mt-3 text-sm text-ws-muted">
        どんなポートフォリオにしていきたい。そのために、どう時間を使いたい。今日時点のアイディアでOKです。
      </p>

      {step === "single" ? (
        which === "current" ? (
          <div>
            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="inline-block rounded bg-ws-mint px-3 py-1 text-base font-bold text-ws-teal">
                現在（2026年）のマイ・ポートフォリオ ＝ Day1で作成
              </p>
              {stepButtons}
            </div>
            <CommunityPortfolio
              value={current}
              readOnly={viewOnly}
              onChange={onCurrentChange}
            />
          </div>
        ) : (
          <div>
            <div className="mt-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
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
              {stepButtons}
            </div>
            <CommunityPortfolio
              value={future}
              readOnly={viewOnly}
              onChange={onFutureChange}
            />
          </div>
        )
      ) : (
        <div className="mt-5 mx-auto" style={{ width: MINI_W * 2 + 130 }}>
          {/* 現在 → 未来 を、間の矢印（+年後）を挟んで比較 */}
          <div className="flex items-center justify-center gap-6">
            <CurrentSlot
              value={current}
              viewOnly={viewOnly}
              loaded={currentLoaded}
              onLoad={() => onCurrentLoadedChange(true)}
              onEdit={() => {
                onWhichChange("current");
                onStepChange("single");
              }}
            />
            <div className="flex shrink-0 flex-col items-center gap-1">
              <span className="no-print inline-flex items-center gap-1 text-sm text-ws-muted">
                <input
                  readOnly={viewOnly}
                  value={year}
                  onChange={(e) => onYearChange(e.target.value)}
                  placeholder="X"
                  className="w-12 rounded-md border border-ws-line px-2 py-1 text-center text-ws-ink outline-none focus:border-ws-teal"
                />
                年後
              </span>
              <span className="flex items-center">
                <span className="h-0.5 w-10 bg-ws-teal" />
                <ArrowRight className="-ml-1 h-5 w-5 shrink-0 text-ws-teal" />
              </span>
            </div>
            <FutureSlot
              value={future}
              viewOnly={viewOnly}
              onEdit={() => {
                onWhichChange("future");
                onStepChange("single");
              }}
            />
          </div>
          <p className="mt-4 text-center">
            <span className="inline-block rounded bg-ws-mint px-3 py-1 text-base font-bold text-ws-teal">
              現在から未来へシフト
            </span>
          </p>
          <div className="mt-2 flex items-start justify-center gap-3">
            {shift.map((val, i) => (
              <textarea
                key={i}
                readOnly={viewOnly}
                value={val}
                onChange={(e) => onShiftItemChange(i, e.target.value)}
                rows={3}
                placeholder={`シフトポイント${i + 1}`}
                style={{ width: SHIFT_BOX_W }}
                className="shrink-0 resize-none rounded-md border border-ws-line px-3 py-2 text-sm leading-relaxed text-ws-ink outline-none placeholder:text-ws-muted/50 focus:border-ws-teal"
              />
            ))}
            {shiftShowAddButton && (
              <button
                type="button"
                onClick={onShiftAdd}
                className="no-print flex h-[76px] w-10 shrink-0 items-center justify-center rounded-md border border-dashed border-ws-line text-lg font-bold text-ws-muted transition-colors hover:border-ws-teal hover:text-ws-teal"
                aria-label="シフトポイントを追加"
              >
                ＋
              </button>
            )}
          </div>
        </div>
      )}
    </PrintSheet>
  );
}
