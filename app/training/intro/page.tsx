import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { WorksheetStage } from "@/components/worksheet/WorksheetStage";
import { PrintButton } from "@/components/worksheet/PrintButton";
import {
  ProfileSlideView,
  type ProfileSlideData,
} from "@/components/worksheet/ProfileSlideView";

/**
 * 研修本番（Program B）でのじぶん紹介＝読み取り専用ビュー（発表用）。
 * 事前課題（Program A）で入力した pre.profileSlide を Supabase から読み込んで表示する。
 * 編集は Program A 側（/workshop/pre/profile-slide）で行う。
 */
export default async function TrainingIntroPage() {
  const session = await getSession();
  if (!session) redirect("/login?from=/training/intro");

  const wd = await prisma.workshopData.findUnique({
    where: { userId: session.sub },
    select: { pre: true },
  });
  const slide = (wd?.pre as { profileSlide?: ProfileSlideData } | null)
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

  return (
    <WorksheetStage>
      {/* 操作バー（印刷されない） */}
      <div className="no-print flex w-full max-w-[1123px] flex-wrap items-center justify-between gap-3">
        <Link
          href="/training"
          className="inline-flex items-center gap-1.5 text-sm text-ws-muted hover:text-ws-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          研修本番へ戻る
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/workshop/pre/profile-slide"
            className="inline-flex items-center gap-2 rounded-lg border border-ws-line px-4 py-2 text-sm text-ws-ink transition-colors hover:border-ws-teal"
          >
            <Pencil className="h-4 w-4" />
            編集する（事前課題）
          </Link>
          {hasData && <PrintButton />}
        </div>
      </div>

      {hasData ? (
        <ProfileSlideView data={slide} />
      ) : (
        <div className="mt-10 w-full max-w-[1123px] rounded-2xl border border-ws-line bg-white p-10 text-center">
          <p className="text-lg font-bold text-ws-ink">
            じぶん紹介がまだ作成されていません
          </p>
          <p className="mt-2 text-sm text-ws-muted">
            事前課題でじぶん紹介シートを作成すると、ここに表示されます。
          </p>
          <Link
            href="/workshop/pre/profile-slide"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-ws-teal px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
          >
            <Pencil className="h-4 w-4" />
            事前課題で作成する
          </Link>
        </div>
      )}
    </WorksheetStage>
  );
}
