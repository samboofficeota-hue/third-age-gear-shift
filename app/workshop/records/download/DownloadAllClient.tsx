"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { WorksheetStage } from "@/components/worksheet/WorksheetStage";
import { ProfileSlideView } from "@/app/workshop/pre/profile-slide/ProfileSlideView";
import { Day1Client } from "@/app/training/day1/Day1Client";
import { HomeworkClient } from "@/app/workshop/homework/scenario/HomeworkClient";
import { ExcursionReportClient } from "@/app/workshop/homework/excursion/report/ExcursionReportClient";
import { AssetForm } from "@/app/workshop/homework/assets/AssetForm";
import { Day2Client } from "@/app/training/day2/Day2Client";
import type { ExcursionData } from "@/lib/homework/excursion/types";

/** 「保存」時に候補となるPDFファイル名。拡張子はブラウザ側が付与する。 */
const PDF_FILENAME = "jibun-stragety-work";

function printAsPdf(onDone: () => void) {
  const original = document.title;
  document.title = PDF_FILENAME;
  const restore = () => {
    document.title = original;
    window.removeEventListener("afterprint", restore);
    onDone();
  };
  window.addEventListener("afterprint", restore);
  window.print();
}

export function DownloadAllClient({
  headerName,
  excursionDecisionSummary,
  excursionReport,
}: {
  headerName: string;
  excursionDecisionSummary: string | null;
  excursionReport: ExcursionData["report"];
}) {
  const router = useRouter();
  const nameTag = headerName ? (
    <span className="text-base font-bold text-ws-ink">{headerName}</span>
  ) : null;

  return (
    <WorksheetStage>
      <div className="no-print flex w-full max-w-[1123px] items-center justify-between gap-3">
        <Link
          href="/workshop/guide"
          className="inline-flex items-center gap-1.5 text-sm text-ws-muted hover:text-ws-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          ガイドへ戻る
        </Link>
        <button
          type="button"
          onClick={() => printAsPdf(() => router.push("/workshop/guide"))}
          className="inline-flex items-center gap-2 rounded-full bg-ws-teal px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
        >
          <Printer className="h-4 w-4" />
          PDFで保存 / 印刷
        </button>
      </div>

      <ProfileSlideView />
      <Day1Client viewOnly />
      <HomeworkClient viewOnly />
      {excursionDecisionSummary && (
        <ExcursionReportClient
          nameTag={nameTag}
          decisionSummary={excursionDecisionSummary}
          initial={excursionReport}
          viewOnly
        />
      )}
      <AssetForm assetKey="productivity" viewOnly />
      <AssetForm assetKey="vitality" viewOnly />
      <AssetForm assetKey="transformation" viewOnly />
      <Day2Client viewOnly />
    </WorksheetStage>
  );
}
