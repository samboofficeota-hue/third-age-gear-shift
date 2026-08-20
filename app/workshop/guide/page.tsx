import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Check, Lock } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { PHASE_META, type PhaseId } from "@/lib/phases";
import { getDashboardState } from "@/lib/workshopAccess";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";

// フェーズの正順。「今ここ」は、この順で最初に completedPhases に無いフェーズ。
const FORWARD_ORDER: PhaseId[] = ["pre", "day1", "homework", "day2", "post"];

type PrimaryAction = {
  label: string;
  href: string;
  locked: boolean;
  lockedNote?: string | null;
};

function formatDateJa(d: Date | null): string | null {
  if (!d) return null;
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Tokyo",
  }).format(d);
}

/**
 * 事前課題に入る前の「全体ガイダンス」。
 * 目的：講座全体の流れを一覧で見せ、「今ここ」を理解してもらい、
 * 今やるべき1つのアクションへ導く。
 */
export default async function WorkshopGuidePage() {
  const session = await getSession();
  if (!session) redirect("/login?from=/workshop/guide");

  const state = await getDashboardState();
  const statuses = state?.statuses;
  const completedPhases = state?.completedPhases ?? [];

  let currentPhaseId: PhaseId | null = null;
  for (const id of FORWARD_ORDER) {
    if (!completedPhases.includes(id)) {
      currentPhaseId = id;
      break;
    }
  }

  const wsSession = state?.sessionId
    ? await prisma.workshopSession.findUnique({
        where: { id: state.sessionId },
        select: { day1Date: true, day2Date: true },
      })
    : null;
  const day1Date = wsSession?.day1Date ?? null;
  const day2Date = wsSession?.day2Date ?? null;
  const canJoinDay1 = !!day1Date && Date.now() >= day1Date.getTime();
  const canJoinDay2 = !!day2Date && Date.now() >= day2Date.getTime();
  const day1Str = formatDateJa(day1Date);
  const day2Str = formatDateJa(day2Date);
  const homeworkOpen = statuses?.homework === "OPEN";

  const primaryAction: PrimaryAction | null = (() => {
    switch (currentPhaseId) {
      case "pre":
        return { label: "事前課題をはじめる", href: "/workshop/pre", locked: false };
      case "day1":
        return {
          label: "研修に参加する",
          href: "/training",
          locked: !canJoinDay1,
          lockedNote: day1Str ? `Day1（${day1Str}）から参加できます` : null,
        };
      case "homework":
        return {
          label: "宿題をはじめる",
          href: "/workshop/homework",
          locked: !homeworkOpen,
          lockedNote: "Day1終了後、開放されます",
        };
      case "day2":
        return {
          label: "研修に参加する",
          href: "/training",
          locked: !canJoinDay2,
          lockedNote: day2Str ? `Day2（${day2Str}）から参加できます` : null,
        };
      case "post":
        return { label: "事後課題へ進む", href: "/workshop/post", locked: false };
      default:
        return null;
    }
  })();

const introNote = !currentPhaseId ? (
    "すべての課題が完了しています。おつかれさまでした。"
  ) : currentPhaseId === "pre" ? (
    "まずは事前課題からはじめていきましょう。"
  ) : (
    <>
      次は「<span className="font-semibold text-primary">{primaryAction?.label}</span>」です。
    </>
  );

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
          {introNote}
        </p>
      </header>

      <div className="mt-8 flex items-center justify-center gap-1.5 sm:gap-2">
        {PHASE_META.map((p, i) => {
          const flowState = completedPhases.includes(p.id)
            ? "done"
            : p.id === currentPhaseId
              ? "current"
              : "upcoming";
          return (
            <div key={p.id} className="flex items-center gap-1.5 sm:gap-2">
              <FlowStep label={p.day} state={flowState} />
              {i < PHASE_META.length - 1 && (
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Day 1〜Day 2 は、約3週間の期間をかけて進みます
      </p>

      <div className="mx-auto mt-8 flex justify-center">
        {primaryAction ? (
          primaryAction.locked ? (
            <div className="flex w-56 flex-col items-center gap-1.5">
              <div className="inline-flex h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-md border-2 border-border bg-bg-panel px-5 text-base font-semibold text-muted-foreground">
                <Lock className="h-4 w-4" />
                {primaryAction.label}
              </div>
              {primaryAction.lockedNote && (
                <p className="text-xs text-muted-foreground">{primaryAction.lockedNote}</p>
              )}
            </div>
          ) : (
            <Button asChild size="lg" className="w-56">
              <Link href={primaryAction.href}>
                {primaryAction.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )
        ) : (
          <Button asChild size="lg" variant="outline" className="w-56">
            <Link href="/workshop">
              じぶんのワーク記録を見る
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

function FlowStep({
  label,
  state,
}: {
  label: string;
  state: "done" | "current" | "upcoming";
}) {
  return (
    <div
      className={cn(
        "flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border text-center sm:h-20 sm:w-20",
        state === "current"
          ? "border-primary bg-primary/10 shadow-neon-glow"
          : state === "done"
            ? "border-primary/30 bg-card"
            : "border-border bg-card"
      )}
    >
      {state === "current" && (
        <span className="text-[10px] font-bold uppercase tracking-wide text-primary">
          今ここ
        </span>
      )}
      {state === "done" && <Check className="h-3.5 w-3.5 text-primary/70" />}
      <span
        className={cn(
          "text-xs font-bold sm:text-sm",
          state === "current"
            ? "text-primary"
            : state === "done"
              ? "text-secondary-foreground"
              : "text-muted-foreground"
        )}
      >
        {label}
      </span>
    </div>
  );
}
