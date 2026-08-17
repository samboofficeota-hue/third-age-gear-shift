import Link from "next/link";
import { redirect } from "next/navigation";
import { Pencil } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { WorksheetStage } from "@/components/worksheet/WorksheetStage";
import { PrintSheet } from "@/components/worksheet/PrintSheet";
import { SheetHeader } from "@/components/worksheet/SheetHeader";
import { LifeLineChart } from "@/components/worksheet/LifeLineChart";
import { sortedForChart, type LifeCurvePoint } from "@/app/workshop/pre/life-plan/_types";
import { ProfileSlideReadOnly } from "@/components/worksheet/ProfileSlideReadOnly";
import type { Slide } from "@/app/workshop/pre/profile-slide/_types";

/**
 * 研修本番（Program B）でのじぶん紹介＝読み取り専用ビュー（発表用）。
 * 事前課題（Program A）で入力した pre.profileSlide / pre.lifeCurve を
 * Supabase から読み込んで表示する。編集は Program A 側（/workshop/pre/*）で行う。
 */
export default async function TrainingIntroPage() {
  const session = await getSession();
  if (!session) redirect("/login?from=/training/intro");

  const wd = await prisma.workshopData.findUnique({
    where: { userId: session.sub },
    select: { pre: true },
  });
  const pre = wd?.pre as
    | { profileSlide?: Slide; lifeCurve?: { points?: LifeCurvePoint[] } }
    | null;
  const slide = pre?.profileSlide;
  const hasData =
    !!slide &&
    !!(
      slide.name?.trim() ||
      slide.nickname?.trim() ||
      slide.photo?.trim() ||
      (slide.points ?? []).some((p) => p?.trim()) ||
      (slide.history ?? []).some((h) => h.event?.trim())
    );

  const lifeCurvePoints = sortedForChart(pre?.lifeCurve?.points ?? []);
  const hasLifeCurve = lifeCurvePoints.length > 0;

  return (
    <WorksheetStage>
      {hasData ? (
        <ProfileSlideReadOnly data={slide as Slide} />
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

      {hasLifeCurve ? (
        <PrintSheet>
          <SheetHeader
            accent="ライフライン"
            title="・チャート"
            right={<span className="text-sm font-semibold text-ws-teal">事前課題</span>}
          />
          <div className="mt-4 w-full">
            <LifeLineChart points={lifeCurvePoints} />
          </div>
        </PrintSheet>
      ) : (
        <div className="w-full max-w-[1123px] rounded-2xl border border-ws-line bg-white p-10 text-center">
          <p className="text-lg font-bold text-ws-ink">
            ライフラインチャートがまだ作成されていません
          </p>
          <p className="mt-2 text-sm text-ws-muted">
            事前課題でライフラインチャートを作成すると、ここに表示されます。
          </p>
          <Link
            href="/workshop/pre/life-plan"
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
