import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Lock } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { PHASE_META, type PhaseId } from "@/lib/phases";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";

/**
 * 事前課題に入る前の「全体ガイダンス」。
 * 目的：講座全体の流れを一覧で見せ、「今ここ＝事前課題」を理解してもらう。
 * ねらい・目的の詳細は研修当日に説明するため、ここでは記載しない。
 */
export default async function WorkshopGuidePage() {
  const session = await getSession();
  if (!session) redirect("/login?from=/workshop/guide");

  const currentPhaseId: PhaseId = "pre";

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { workshopData: { select: { session: { select: { day1Date: true } } } } },
  });
  const day1Date = user?.workshopData?.session?.day1Date ?? null;
  const canJoinTraining = !!day1Date && Date.now() >= day1Date.getTime();
  const day1Str = day1Date
    ? new Intl.DateTimeFormat("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "short",
        timeZone: "Asia/Tokyo",
      }).format(day1Date)
    : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8">
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          {BRAND.tagline}
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
          {BRAND.name}
        </h1>
        <p className="subtitle mt-2">研修の流れ</p>
        <p className="lead mx-auto mt-3 max-w-xl">
          これまでの「じぶん」を棚卸して、これからの「じぶん」を描く。
          <br />
          サードエイジへ向けた、「じぶん」の経営戦略をつくっていく講座です。
          <br />
          講座の流れは次のようになっています。
          <br />
          まずは事前課題からはじめていきましょう。
        </p>
      </header>

      <div className="mt-8 flex items-center justify-center gap-1.5 sm:gap-2">
        {PHASE_META.map((p, i) => (
          <div key={p.id} className="flex items-center gap-1.5 sm:gap-2">
            <FlowStep label={p.day} current={p.id === currentPhaseId} />
            {i < PHASE_META.length - 1 && (
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Day 1〜Day 2 は、約3週間の期間をかけて進みます
      </p>

      <div className="mx-auto mt-8 grid max-w-lg grid-cols-2 items-start gap-3">
        <Button asChild size="lg" className="w-full">
          <Link href="/workshop/pre">
            事前課題をはじめる
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>

        {canJoinTraining ? (
          <Button asChild size="lg" variant="outline" className="w-full">
            <Link href="/training">
              研修に参加する
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <div className="inline-flex h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-md border-2 border-border bg-bg-panel px-5 text-base font-semibold text-muted-foreground">
              <Lock className="h-4 w-4" />
              研修に参加する
            </div>
            {day1Str && (
              <p className="text-xs text-muted-foreground">Day1（{day1Str}）から参加できます</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FlowStep({ label, current }: { label: string; current: boolean }) {
  return (
    <div
      className={cn(
        "flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl border text-center sm:h-20 sm:w-20",
        current
          ? "border-primary bg-primary/10 shadow-neon-glow"
          : "border-border bg-card"
      )}
    >
      {current && (
        <span className="mb-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
          今ここ
        </span>
      )}
      <span
        className={cn(
          "text-xs font-bold sm:text-sm",
          current ? "text-primary" : "text-foreground"
        )}
      >
        {label}
      </span>
    </div>
  );
}
