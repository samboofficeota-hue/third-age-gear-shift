"use client";

import type { ReactNode } from "react";
import { WorksheetStage } from "@/components/worksheet/WorksheetStage";
import { PrintSheet } from "@/components/worksheet/PrintSheet";
import { SheetHeader } from "@/components/worksheet/SheetHeader";
import { LifeLineChart } from "@/components/worksheet/LifeLineChart";
import { ProfileSlideReadOnly } from "@/components/worksheet/ProfileSlideReadOnly";
import { Day1Client } from "@/app/training/day1/Day1Client";
import { HomeworkClient } from "@/app/workshop/homework/scenario/HomeworkClient";
import { ExcursionReportClient } from "@/app/workshop/homework/excursion/report/ExcursionReportClient";
import { AssetForm } from "@/app/workshop/homework/assets/AssetForm";
import { Day2Client } from "@/app/training/day2/Day2Client";
import { sortedForChart, type LifeCurvePoint } from "@/app/workshop/pre/life-plan/_types";
import type { Slide } from "@/app/workshop/pre/profile-slide/_types";
import type { ExcursionData } from "@/lib/homework/excursion/types";
import type { SheetId } from "../../sheets";

/**
 * シート本体。受講生本人の画面と**同じコンポーネント**を viewOnly で描く。
 * 講師用に作り直すと受講生の画面と少しずつズレていくので、必ず共通のものを使う。
 */
export function SheetView({
  sheet,
  participantId,
  headerName,
  slide,
  lifeCurvePoints,
  excursionDecisionSummary,
  excursionReport,
}: {
  sheet: SheetId;
  participantId: string;
  headerName: string;
  slide?: Slide;
  lifeCurvePoints: LifeCurvePoint[];
  excursionDecisionSummary: string | null;
  excursionReport: ExcursionData["report"];
}) {
  const nameTag: ReactNode = headerName ? (
    <span className="text-base font-bold text-ws-ink">{headerName}</span>
  ) : null;

  if (sheet === "day1") return <Day1Client viewOnly participantId={participantId} />;
  if (sheet === "day2") return <Day2Client viewOnly participantId={participantId} />;
  if (sheet === "scenario")
    return <HomeworkClient viewOnly participantId={participantId} />;

  if (sheet === "assets")
    return (
      <WorksheetStage>
        <AssetForm assetKey="productivity" viewOnly participantId={participantId} />
        <AssetForm assetKey="vitality" viewOnly participantId={participantId} />
        <AssetForm assetKey="transformation" viewOnly participantId={participantId} />
      </WorksheetStage>
    );

  if (sheet === "excursion")
    return excursionDecisionSummary ? (
      <ExcursionReportClient
        nameTag={nameTag}
        decisionSummary={excursionDecisionSummary}
        initial={excursionReport}
        viewOnly
      />
    ) : (
      <WorksheetStage>
        <Empty label="プチ越境体験の企画がまだ決まっていません" />
      </WorksheetStage>
    );

  // intro: じぶん紹介 ＋ ライフラインチャート（/training/intro と同じ構成）
  const hasSlide =
    !!slide &&
    !!(
      slide.name?.trim() ||
      slide.nickname?.trim() ||
      slide.photo?.trim() ||
      (slide.points ?? []).some((p) => p?.trim()) ||
      (slide.history ?? []).some((h) => h.event?.trim())
    );
  const points = sortedForChart(lifeCurvePoints);

  return (
    <WorksheetStage>
      {hasSlide ? (
        <ProfileSlideReadOnly data={slide as Slide} />
      ) : (
        <Empty label="じぶん紹介がまだ作成されていません" />
      )}

      {points.length > 0 ? (
        <PrintSheet>
          <SheetHeader
            accent="ライフライン"
            title="・チャート"
            right={<span className="text-sm font-semibold text-ws-teal">事前課題</span>}
          />
          <div className="mt-4 w-full">
            <LifeLineChart points={points} />
          </div>
        </PrintSheet>
      ) : (
        <Empty label="ライフラインチャートがまだ作成されていません" />
      )}
    </WorksheetStage>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="w-full max-w-[1123px] rounded-2xl border border-ws-line bg-white p-10 text-center">
      <p className="text-lg font-bold text-ws-ink">{label}</p>
      <p className="mt-2 text-sm text-ws-muted">
        受講生が入力すると、ここに表示されます。
      </p>
    </div>
  );
}
