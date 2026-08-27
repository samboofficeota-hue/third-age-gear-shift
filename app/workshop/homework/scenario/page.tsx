import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canAccessPhase } from "@/lib/workshopAccess";
import { cn } from "@/lib/utils";
import { HomeworkClient } from "./HomeworkClient";

type Blanks = Record<string, string>;

function hasText(blanks: unknown): boolean {
  if (!blanks || typeof blanks !== "object") return false;
  return Object.values(blanks as Blanks).some((v) => (v ?? "").trim().length > 0);
}

/**
 * 宿題(b) みらいシナリオ（Program A＝個別・非同期）。講師が開放したときのみアクセス可。
 * ?mode=view のときは閲覧モード（事後の自分の記録閲覧、会社編・社会編を両方まとめて表示）。フェーズ開放問わず。
 * 通常入口は「扉ページ」（このページ自身）。過去→今日→会社／社会、という分岐図から
 * 会社編・社会編それぞれの記入ページへ飛ばす。詳細は docs/DEV_ROADMAP.md 参照。
 */
export default async function HomeworkScenarioPage({
  searchParams,
}: {
  searchParams: { mode?: string };
}) {
  const view = searchParams.mode === "view";

  if (view) {
    const session = await getSession();
    if (!session) redirect("/login?from=/workshop/homework/scenario?mode=view");
    return <HomeworkClient viewOnly />;
  }

  const session = await getSession();
  if (!session) redirect("/login?from=/workshop/homework/scenario");

  const { ok } = await canAccessPhase("homework");
  if (!ok) redirect("/workshop/homework");

  const wd = await prisma.workshopData.findUnique({
    where: { userId: session.sub },
    select: { homework: true },
  });
  const scenario = (wd?.homework as { scenario?: { company?: Blanks; society?: Blanks } } | null)
    ?.scenario;
  const societyDone = hasText(scenario?.society);
  const companyDone = hasText(scenario?.company);

  const branches = [
    {
      key: "society",
      label: "社会編",
      outcome: "2045年、じぶんがいる社会",
      href: "/workshop/homework/scenario/society",
      done: societyDone,
    },
    {
      key: "company",
      label: "会社編",
      outcome: "XX歳の、じぶんが語る言葉",
      href: "/workshop/homework/scenario/company",
      done: companyDone,
    },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:px-6">
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <p className="eyebrow">宿題</p>
        <p className="mt-1 text-lg font-bold text-foreground">みらいシナリオを描こう</p>
        <p className="mt-2 text-sm leading-relaxed text-secondary-foreground">
          会社と社会。2つの軸で「こうなっているかも」という未来を"妄想"してみましょう。
        </p>

        {/* 過去→今日→(社会/会社) の分岐図。社会・会社の箱は、そのまま各記入ページへのリンク */}
        <div className="mt-6 flex flex-col items-center gap-4">
          <div className="w-full overflow-hidden rounded-xl bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mirai-scenario.png"
              alt="みらいシナリオの考え方：過去から今日、そして会社と社会の2つの軸で未来を描く"
              className="w-full"
            />
          </div>

          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
            {branches.map((b) => (
              <Link
                key={b.key}
                href={b.href}
                className={cn(
                  "group flex flex-col gap-2 rounded-xl border-2 p-4 shadow-neon transition-all hover:-translate-y-1 hover:shadow-neon-strong",
                  b.done
                    ? "border-primary/50 bg-primary/10 hover:border-primary"
                    : "border-primary/30 bg-primary/5 hover:border-primary"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-foreground">{b.label}</span>
                  {b.done ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                  ) : (
                    <ArrowRight className="h-5 w-5 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
                  )}
                </div>
                <p className="text-caption text-muted-foreground">→ {b.outcome}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
