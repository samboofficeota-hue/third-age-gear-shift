import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  UserCircle,
  CheckCircle2,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";

/**
 * 事前課題の「扉（ウェルカム）／ハブ」シート。
 * 参加お礼 → 2課題（事前アンケート・自己紹介シート）の状況 → 両方そろえば提出。
 */
export default async function PrePage() {
  const session = await getSession();
  let name = "";
  let surveyDone = false;
  let slideDone = false;

  if (session) {
    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { name: true, workshopData: { select: { pre: true } } },
    });
    name = (user?.name ?? "").trim();
    const pre = user?.workshopData?.pre as
      | { survey?: Record<string, unknown>; profileSlide?: Record<string, unknown> }
      | null;
    surveyDone = !!pre?.survey && Object.keys(pre.survey).length > 0;
    slideDone = !!pre?.profileSlide && Object.keys(pre.profileSlide).length > 0;
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
      <div className="rounded-2xl border border-[rgba(0,255,136,0.2)] bg-[#141a2a] p-6 sm:p-8">
        <p className="text-lg font-bold text-[#e0f0e8]">
          {name ? `${name}さん、こんにちは。` : "こんにちは。"}
        </p>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-[#c8dccf]">
          <p>
            この度は「サードエイジ じぶん戦略講座」にご参加をいただけるとのこと。
            誠にありがとうございます。
          </p>
          <p>ご参加に先立って、次の2つへの記入をお願いいたします。</p>
        </div>

        <p className="mt-4 rounded-lg border border-[rgba(0,255,136,0.15)] bg-[#0f1420] px-3 py-2.5 text-xs leading-relaxed text-[#a0c0b0]">
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
                    : "border-[rgba(0,255,136,0.15)] bg-[#0f1420] hover:border-primary/50"
                )}
              >
                {t.done ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                ) : (
                  <t.icon className="h-5 w-5 shrink-0 text-primary" />
                )}
                <span className="text-sm font-medium text-[#e0f0e8]">
                  {t.label}
                </span>
                <span className="ml-auto flex items-center gap-2">
                  {t.done && (
                    <span className="text-[11px] font-semibold text-primary">
                      記入済み
                    </span>
                  )}
                  <span className="text-[11px] text-muted-foreground">
                    {t.note}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>

        {bothDone ? (
          <>
            <p className="mt-6 text-sm text-[#c8dccf]">
              両方そろいました。これで事前課題は完了です。
            </p>
            <div className="mt-4">
              <Link
                href="/workshop/pre/done"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:bg-[#00cc6a]"
              >
                事前課題を提出する
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="mt-5 text-sm text-[#c8dccf]">
              まずは、
              <span className="font-bold text-primary">事前アンケート</span>
              からお願いします。
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                href="/workshop/pre/survey"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:bg-[#00cc6a]"
              >
                {surveyDone ? "自己紹介シートに進む" : "事前アンケートに進む"}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/workshop/pre/profile-slide"
                className="text-center text-xs text-muted-foreground hover:text-[#e0f0e8]"
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
          className="text-xs text-muted-foreground hover:text-[#e0f0e8]"
        >
          ← ダッシュボードへ戻る
        </Link>
      </div>
    </div>
  );
}
