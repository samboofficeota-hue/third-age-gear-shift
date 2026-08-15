import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  UserCircle,
  LineChart,
  CheckCircle2,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";
import { Button } from "@/components/ui/button";

/**
 * 事前課題の「扉（ウェルカム）／ハブ」シート。
 * 参加お礼 → 2課題（事前アンケート・自己紹介シート）の状況 → 両方そろえば提出。
 */
export default async function PrePage() {
  const session = await getSession();
  let name = "";
  let surveyDone = false;
  let slideDone = false;
  let lifeCurveDone = false;

  if (session) {
    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { name: true, workshopData: { select: { pre: true } } },
    });
    name = (user?.name ?? "").trim();
    const pre = user?.workshopData?.pre as
      | {
          survey?: Record<string, unknown>;
          profileSlide?: Record<string, unknown>;
          lifeCurve?: { points?: unknown[] };
        }
      | null;
    surveyDone = !!pre?.survey && Object.keys(pre.survey).length > 0;
    slideDone = !!pre?.profileSlide && Object.keys(pre.profileSlide).length > 0;
    lifeCurveDone = !!pre?.lifeCurve?.points && pre.lifeCurve.points.length > 0;
  }

  const bothDone = surveyDone && slideDone;

  const tasks = [
    {
      href: "/workshop/pre/survey",
      icon: ClipboardList,
      label: "事前アンケート",
      note: "所要 約5分",
      done: surveyDone,
    },
    {
      href: "/workshop/pre/profile-slide",
      icon: UserCircle,
      label: "自己紹介シート",
      note: "Day1で発表",
      done: slideDone,
    },
  ];

  return (
    <div className="mx-auto max-w-xl px-4 py-12 md:px-6">
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <p className="text-lg font-bold text-foreground">
          {name ? `${name}さん、こんにちは。` : "こんにちは。"}
        </p>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-secondary-foreground">
          <p>
            この度は「{BRAND.name}」にご参加をいただけるとのこと。
            誠にありがとうございます。
          </p>
          <p>ご参加に先立って、次の2つへの記入をお願いいたします。</p>
        </div>

        <p className="mt-4 rounded-lg border border-border bg-bg-panel px-3 py-2.5 text-xs leading-relaxed text-secondary-foreground">
          💻 記入は <span className="font-semibold text-primary">パソコン</span>{" "}
          での操作をおすすめします（特に「自己紹介シート」はPC向けに作られています）。
        </p>

        <ol className="mt-5 space-y-2">
          {tasks.map((t) => (
            <li key={t.href}>
              <Link
                href={t.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors",
                  t.done
                    ? "border-primary/40 bg-primary/10 hover:border-primary"
                    : "border-border bg-bg-panel hover:border-primary/50"
                )}
              >
                {t.done ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                ) : (
                  <t.icon className="h-5 w-5 shrink-0 text-primary" />
                )}
                <span className="text-sm font-medium text-foreground">
                  {t.label}
                </span>
                <span className="ml-auto flex items-center gap-2">
                  {t.done && (
                    <span className="text-caption font-semibold text-primary">
                      記入済み
                    </span>
                  )}
                  <span className="text-caption text-muted-foreground">
                    {t.note}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>

        <div className="mt-4">
          <Link
            href="/workshop/pre/life-plan"
            className={cn(
              "flex items-center gap-3 rounded-lg border border-dashed px-4 py-3 transition-colors",
              lifeCurveDone
                ? "border-primary/40 bg-primary/10 hover:border-primary"
                : "border-border hover:border-primary/50"
            )}
          >
            {lifeCurveDone ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
            ) : (
              <LineChart className="h-5 w-5 shrink-0 text-primary" />
            )}
            <span className="text-sm font-medium text-foreground">
              ライフラインチャート
            </span>
            <span className="ml-auto flex items-center gap-2">
              {lifeCurveDone && (
                <span className="text-caption font-semibold text-primary">
                  記入済み
                </span>
              )}
              <span className="text-caption text-muted-foreground">任意</span>
            </span>
          </Link>
        </div>

        {bothDone ? (
          <>
            <p className="mt-6 text-sm text-secondary-foreground">
              両方そろいました。これで事前課題は完了です。
            </p>
            <div className="mt-4">
              <Button asChild className="w-full">
                <Link href="/workshop/pre/done">
                  事前課題を提出する
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-5 text-sm text-secondary-foreground">
              まずは、
              <span className="font-bold text-primary">事前アンケート</span>
              からお願いします。
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Button asChild>
                <Link href="/workshop/pre/survey">
                  {surveyDone ? "自己紹介シートに進む" : "事前アンケートに進む"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Link
                href="/workshop/pre/profile-slide"
                className="text-center text-xs text-muted-foreground hover:text-foreground"
              >
                先に自己紹介シートを見る
              </Link>
            </div>
          </>
        )}
      </div>

      <div className="mt-4 text-center">
        <Link
          href="/workshop"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← ダッシュボードへ戻る
        </Link>
      </div>
    </div>
  );
}
