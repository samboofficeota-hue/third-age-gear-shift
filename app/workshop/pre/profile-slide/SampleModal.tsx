"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { formatHeaderName } from "@/components/worksheet/SheetHeader";
import { IntroSheet } from "./sheets/IntroSheet";
import { HistorySheet } from "./sheets/HistorySheet";
import { WorkSheet } from "./sheets/WorkSheet";
import { pad, type Slide } from "./_types";

const noop = () => {};

/**
 * 「記入例を見る」フローティングボタンから開く、記入例プレビューのモーダル。
 * 本体の記入状態には触れず、記入例データだけを別読み込みして読み取り専用表示する。
 */
export function SampleModal({ onClose }: { onClose: () => void }) {
  const [example, setExample] = useState<Slide | null>(null);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const d = await fetch("/api/workshop/example", { credentials: "include" })
        .then((r) => r.json())
        .catch(() => ({}));
      const ps = (d?.example?.pre?.profileSlide ?? {}) as Slide;
      setExample({ ...ps, points: pad(ps.points) });
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const view: Slide = example ?? { points: pad([]) };
  const nameTag = (
    <span className="text-base font-bold text-ws-ink">
      {formatHeaderName(view.name, view.nickname)}
    </span>
  );
  const preTag = <span className="text-sm font-semibold text-ws-teal">記入例</span>;
  const histRows = (example?.history ?? []).filter(
    (h) => h.year.trim() || h.event.trim()
  );

  return (
    <div className="no-print fixed inset-0 z-50 flex flex-col bg-bg-dark/95 backdrop-blur">
      <div className="flex items-center justify-between border-b border-border px-4 py-3 md:px-8">
        <p className="text-sm font-semibold text-foreground">記入例（太田義史さん）</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="閉じる"
          className="rounded-lg p-1.5 text-secondary-foreground transition hover:bg-bg-panel hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
        {loading ? (
          <p className="text-center text-sm text-muted-foreground">読み込み中...</p>
        ) : (
          <div className="mx-auto flex w-fit flex-col items-center gap-6">
            <IntroSheet
              preTag={preTag}
              view={view}
              data={view}
              isSample
              visibleCount={3}
              photoUploading={false}
              fileRef={fileRef}
              onPickFile={noop}
              onAdjustPhoto={noop}
              onUploadClick={noop}
              onSetField={noop}
              onSetPoint={noop}
              onIncreaseVisible={noop}
            />
            <HistorySheet
              nameTag={nameTag}
              rows={histRows}
              isSample
              onSetHist={noop}
              onAddRow={noop}
            />
            <WorkSheet
              nameTag={nameTag}
              view={view}
              data={view}
              isSample
              onSetWork={noop}
            />
          </div>
        )}
      </div>
    </div>
  );
}
