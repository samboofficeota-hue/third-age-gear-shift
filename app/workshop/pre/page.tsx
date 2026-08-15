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
 * 参加お礼 → 3課題（事前アンケート・自己紹介シート・ライフラインチャート）の状況 → 揃えば提出。
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
      note: "Day1で使用",
      done: slideDone,
    },
    {
      href: "/workshop/pre/life-plan",
      icon: LineChart,
      label: "ライフラインチャート",
      note: "Day1で使用",
      done: lifeCurveDone,
    },
  ];

  const allDone = tasks.every((t) => t.done);
  const nextTask = tasks.find((t) => !t.done);

  return (
    <div className="mx-auto max-w-xl px-4 py-12 md:px-6">
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <p className="eyebrow">事前課題</p>
        <p className="mt-2 text-lg font-bold text-foreground">
          {name ? `${name}さん、こんにちは。` : "こんにちは。"}
        </p>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-secondary-foreground">
          <p>
            この度は「{BRAND.name}」にご参加をいただき、ありがとうございます。
          </p>
          <p>
            研修当日に先立って、事前課題の記入およびご提出をお願いしています。
            <br />
            必ず、前日までにお済ませください。
          </p>
        </div>

        <p className="mt-4 rounded-lg border border-border bg-bg-panel px-3 py-2.5 text-xs leading-relaxed text-secondary-foreground">
          💻 記入は、スマホではなく
          <span className="font-semibold text-primary">PC</span>
          をご使用ください。ワークシートの多くが、PC版を前提に作られています。
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

        {allDone ? (
          <>
            <p className="mt-6 text-sm text-secondary-foreground">
              これで事前課題は完了です。おつかれさまでした。
            </p>
            <div className="mt-4 flex justify-center">
              <Button asChild>
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
              <span className="font-bold text-primary">{nextTask?.label}</span>
              からお願いします。
            </p>
            <div className="mt-6 flex justify-center">
              <Button asChild>
                <Link href={nextTask?.href ?? "/workshop/pre/survey"}>
                  {nextTask?.label}に進む
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
