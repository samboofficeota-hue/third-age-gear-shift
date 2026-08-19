import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canAccessPhase } from "@/lib/workshopAccess";
import { formatHeaderName } from "@/components/worksheet/SheetHeader";
import { ExcursionReportClient } from "./ExcursionReportClient";
import type { ExcursionData } from "@/lib/homework/excursion/types";

/**
 * プチ越境体験(a)の「体験レポート」段階。
 * 「プチ体験の企画を練る」（AIインタビュー）で決めた内容が無ければ、そちらへ戻す。
 */
export default async function ExcursionReportPage() {
  const session = await getSession();
  if (!session) redirect("/login?from=/workshop/homework/excursion/report");

  const { ok } = await canAccessPhase("homework");
  if (!ok) redirect("/workshop/homework");

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { name: true, workshopData: { select: { pre: true, homework: true } } },
  });
  const ps = (
    user?.workshopData?.pre as { profileSlide?: { name?: string; nickname?: string } } | null
  )?.profileSlide;
  const headerName = formatHeaderName(
    (ps?.name ?? user?.name ?? "").trim(),
    (ps?.nickname ?? "").trim()
  );

  const excursion = (user?.workshopData?.homework as { excursion?: ExcursionData } | null)
    ?.excursion;
  if (!excursion?.decision) redirect("/workshop/homework/excursion");

  return (
    <ExcursionReportClient
      nameTag={
        headerName ? <span className="text-base font-bold text-ws-ink">{headerName}</span> : null
      }
      decisionSummary={excursion.decision.summary}
      initial={excursion.report}
    />
  );
}
