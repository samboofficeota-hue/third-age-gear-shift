"use client";

import { useRef } from "react";
import { formatHeaderName } from "@/components/worksheet/SheetHeader";
import { IntroSheet } from "@/app/workshop/pre/profile-slide/sheets/IntroSheet";
import { HistorySheet } from "@/app/workshop/pre/profile-slide/sheets/HistorySheet";
import { WorkSheet } from "@/app/workshop/pre/profile-slide/sheets/WorkSheet";
import { pad, type Slide } from "@/app/workshop/pre/profile-slide/_types";

const noop = () => {};

/**
 * じぶん紹介の「読み取り専用」表示（発表用・管理画面用）。
 * 編集画面（/workshop/pre/profile-slide）と同じシートコンポーネントを isSample モードで再利用し、
 * 見た目の二重管理を避ける。
 */
export function ProfileSlideReadOnly({ data }: { data: Slide }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const view: Slide = { ...data, points: pad(data.points) };

  const nameTag = (
    <span className="text-base font-bold text-ws-ink">
      {formatHeaderName(view.name, view.nickname)}
    </span>
  );
  const preTag = <span className="text-sm font-semibold text-ws-teal">事前課題</span>;
  const histRows = (data.history ?? []).filter(
    (h) => h.year?.trim() || h.event?.trim()
  );

  return (
    <>
      <IntroSheet
        preTag={preTag}
        view={view}
        data={view}
        isSample
        visibleCount={5}
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
      <WorkSheet nameTag={nameTag} view={view} data={view} isSample onSetWork={noop} />
    </>
  );
}
