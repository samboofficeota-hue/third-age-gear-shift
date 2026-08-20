import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatHeaderName } from "@/components/worksheet/SheetHeader";
import { DownloadAllClient } from "./DownloadAllClient";
import type { ExcursionData } from "@/lib/homework/excursion/types";

/**
 * じぶん紹介〜Day2までの全ワークをまとめて読み取り専用表示し、
 * 一括で「印刷（PDF保存）」できるページ。事後アンケート送信後の
 * お礼画面から「PDFでダウンロード」として遷移する。
 * フェーズ開放は問わない（自分の記録を振り返る導線のため、mode=view系と同じ扱い）。
 */
export default async function DownloadAllPage() {
  const session = await getSession();
  if (!session) redirect("/login?from=/workshop/records/download");

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

  return (
    <DownloadAllClient
      headerName={headerName}
      excursionDecisionSummary={excursion?.decision?.summary ?? null}
      excursionReport={excursion?.report}
    />
  );
}
