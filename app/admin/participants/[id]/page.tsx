import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sessionScopeFor } from "@/lib/adminAuth";
import { WorksheetStage } from "@/components/worksheet/WorksheetStage";
import { PrintButton } from "@/components/worksheet/PrintButton";
import { ProfileSlideReadOnly } from "@/components/worksheet/ProfileSlideReadOnly";
import type { Slide } from "@/app/workshop/pre/profile-slide/_types";

/**
 * 講師・事務局向け「じぶん紹介」の閲覧（F-2）。Day1の発表ファシリで使う。
 * 受講生が Program A で入力した pre.profileSlide を読み取り専用で表示する。
 */
export default async function AdminParticipantProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  if (!session) redirect(`/login?from=/admin/participants/${params.id}`);
  if (session.role !== "admin" && session.role !== "facilitator") redirect("/");

  const scope = sessionScopeFor(session);
  const user = await prisma.user.findFirst({
    where: {
      id: params.id,
      role: "participant",
      ...(Object.keys(scope).length > 0
        ? { workshopData: { session: scope } }
        : {}),
    },
    include: {
      organization: { select: { name: true } },
      workshopData: {
        select: { pre: true, session: { select: { name: true, code: true } } },
      },
    },
  });
  if (!user) notFound();

  const slide = (user.workshopData?.pre as { profileSlide?: Slide } | null)
    ?.profileSlide;
  const hasData =
    !!slide &&
    !!(
      slide.name?.trim() ||
      slide.nickname?.trim() ||
      slide.photo?.trim() ||
      (slide.points ?? []).some((p) => p?.trim()) ||
      (slide.history ?? []).some((h) => h.event?.trim())
    );

  const displayName = slide?.name?.trim() || user.name || user.email;
  const affiliation = [user.organization?.name, user.department]
    .filter(Boolean)
    .join(" / ");

  return (
    <WorksheetStage>
      <div className="no-print flex w-full max-w-[1123px] flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm text-ws-muted hover:text-ws-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          管理ダッシュボードへ戻る
        </Link>
        <div className="flex items-center gap-3">
          <div className="text-right text-xs text-ws-muted">
            <p className="font-medium text-ws-ink">{displayName}</p>
            {affiliation && <p>{affiliation}</p>}
          </div>
          {hasData && <PrintButton />}
        </div>
      </div>

      {hasData ? (
        <ProfileSlideReadOnly data={slide as Slide} />
      ) : (
        <div className="mt-10 w-full max-w-[1123px] rounded-2xl border border-ws-line bg-white p-10 text-center">
          <p className="text-lg font-bold text-ws-ink">
            じぶん紹介はまだ提出されていません
          </p>
          <p className="mt-2 text-sm text-ws-muted">
            {displayName} さんが事前課題で作成すると、ここに表示されます。
          </p>
        </div>
      )}
    </WorksheetStage>
  );
}
