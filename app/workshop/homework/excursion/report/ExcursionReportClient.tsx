"use client";

import type { ReactNode } from "react";
import { WorksheetStage } from "@/components/worksheet/WorksheetStage";
import { ReportForm } from "../ReportForm";
import type { ExcursionData } from "@/lib/homework/excursion/types";

export function ExcursionReportClient({
  nameTag,
  decisionSummary,
  initial,
  viewOnly = false,
}: {
  nameTag: ReactNode;
  decisionSummary: string;
  initial: ExcursionData["report"];
  viewOnly?: boolean;
}) {
  return (
    <WorksheetStage>
      <ReportForm
        nameTag={nameTag}
        decisionSummary={decisionSummary}
        initial={initial}
        viewOnly={viewOnly}
      />
    </WorksheetStage>
  );
}
