"use client";

import { useEffect, useState } from "react";
import { formatHeaderName } from "@/components/worksheet/SheetHeader";
import { pad, padHist, type Slide } from "./_types";
import { RuleSheet } from "./sheets/RuleSheet";
import { IntroSheet } from "./sheets/IntroSheet";
import { HistorySheet } from "./sheets/HistorySheet";
import { WorkSheet } from "./sheets/WorkSheet";

const noop = () => {};

/**
 * じぶん紹介（事前課題）の読み取り専用表示。
 * 各シートは既存の isSample モード（記入例モーダルと同じ「表示だけ」の描画）をそのまま流用する。
 * 自分で workshopData.pre.profileSlide を取得するため、単体でも他ページへの埋め込みでも使える。
 */
export function ProfileSlideView() {
  const [data, setData] = useState<Slide | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const d = await fetch("/api/workshop/me", { credentials: "include" })
        .then((r) => r.json())
        .catch(() => ({}));
      const ps = d?.workshopData?.pre?.profileSlide as Slide | undefined;
      setData(ps ?? {});
      setLoading(false);
    })();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-sm text-ws-muted">読み込み中...</p>
      </div>
    );
  }

  const view: Slide = { ...data, points: pad(data.points) };
  const headerName = formatHeaderName(view.name, view.nickname);
  const preTag = (
    <span className="text-sm font-semibold text-ws-teal">事前課題</span>
  );
  const nameTag = headerName ? (
    <span className="text-base font-bold text-ws-ink">{headerName}</span>
  ) : null;
  const histRows = padHist(data.history, Math.max(data.history?.length ?? 0, 1));

  return (
    <>
      <RuleSheet preTag={preTag} />
      <IntroSheet
        preTag={preTag}
        view={view}
        data={data}
        isSample
        visibleCount={5}
        photoUploading={false}
        fileRef={{ current: null }}
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
      <WorkSheet nameTag={nameTag} view={view} data={data} isSample onSetWork={noop} />
    </>
  );
}
