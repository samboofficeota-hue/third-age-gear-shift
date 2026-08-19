import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Compass, MapPin, Send, Sparkles, Wallet } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canAccessPhase } from "@/lib/workshopAccess";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ASSET_KEYS, hasText as assetHasText, type AssetsData } from "@/lib/homework/assets/meta";

function isFilled(j: unknown): boolean {
  if (!j || typeof j !== "object") return false;
  return Object.keys(j as Record<string, unknown>).length > 0;
}

/**
 * 宿題の「扉（ハブ）」シート。
 * Day1が終わってから始まる、個別・非同期の3課題（プチ越境体験／みらいシナリオ／
 * じぶん資産表）の入口。プチ越境体験は「企画を練る（AIインタビュー）」→
 * 「やってみる（体験レポート）」の2カードに分けて見せる。
 */
export default async function HomeworkGatePage() {
  const session = await getSession();
  if (!session) redirect("/login?from=/workshop/homework");

  const { ok } = await canAccessPhase("homework");
  if (!ok) redirect("/workshop/guide");

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { name: true, workshopData: { select: { homework: true } } },
  });
  const name = (user?.name ?? "").trim();
  const homeworkData = user?.workshopData?.homework as
    | {
        scenario?: unknown;
        excursion?: { decision?: unknown; report?: unknown };
        assets?: AssetsData;
      }
    | null;
  const scenarioDone = isFilled(homeworkData?.scenario);
  const excursionPlanned = !!homeworkData?.excursion?.decision;
  const excursionDone = isFilled(homeworkData?.excursion?.report);
  const assetsDone = ASSET_KEYS.every((k) => assetHasText(homeworkData?.assets?.[k]));

  const tasks = [
    {
      id: "excursion-plan",
      icon: Compass,
      label: "プチ越境体験〜まずAIと対話してみる",
      note: "AIとの対話で、プチ越境体験の内容を決める",
      href: "/workshop/homework/excursion",
      done: excursionPlanned,
      badge: "",
    },
    {
      id: "excursion-report",
      icon: MapPin,
      label: "プチ越境体験〜計画と実施レポート",
      note: "「アウェーな環境」を体験してみよう。その気持ちをメモにまとめる",
      href: excursionPlanned ? "/workshop/homework/excursion/report" : null,
      done: excursionDone,
      badge: excursionPlanned ? "" : "先にAI対話から",
    },
    {
      id: "scenario",
      icon: Sparkles,
      label: "みらいシナリオを作ろう",
      note: "「会社とじぶん」「社会とじぶん」2つの妄想ストーリーで未来を描く",
      href: "/workshop/homework/scenario",
      done: scenarioDone,
      badge: "",
    },
    {
      id: "assets",
      icon: Wallet,
      label: "じぶん資産表を作ろう",
      note: "「生産性資産」「活力資産」「変身資産」の3点で自分の現在を描く",
      href: "/workshop/homework/assets",
      done: assetsDone,
      badge: "",
    },
  ];

  // 3つは順不同（プチ越境体験だけ内部でAI対話→レポートの順序あり）。
  // 下部ボタンは「次の1つに進む」ではなく、3つ全部そろったときだけ押せる「提出する」。
  const nextTask = tasks.find((t) => t.href && !t.done);
  const allDone = excursionDone && scenarioDone && assetsDone;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:px-6">
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <p className="eyebrow">宿題</p>
        <p className="mt-1 text-lg font-bold text-foreground">
          {name ? `${name}さん、次に向けて、宿題をがんばりましょう` : "次に向けて、宿題をがんばりましょう"}
        </p>
        <div className="mt-2 space-y-1.5 text-sm leading-relaxed text-secondary-foreground">
          <p>早速ですが、Day2までに、やってほしい宿題が3つあります。</p>
          <p>これらをもとに、Day 2 で経営戦略として作成していく大事な内容となります。</p>
        </div>

        <ol className="mt-3.5 space-y-1">
          {tasks.map((t) => {
            const disabled = !t.href;
            const isNext = t.id === nextTask?.id;
            const content = (
              <div
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3.5 py-2 transition-colors",
                  disabled
                    ? "border-border bg-bg-panel/50 opacity-60"
                    : t.done
                      ? "border-border bg-bg-panel/40 opacity-70"
                      : isNext
                        ? "border-primary bg-primary/10 shadow-neon-glow"
                        : "border-border bg-bg-panel hover:border-primary/50"
                )}
              >
                {t.done ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-muted-foreground" />
                ) : (
                  <t.icon className="h-5 w-5 shrink-0 text-primary" />
                )}
                <div className="min-w-0">
                  <span className="block text-sm font-medium text-foreground">{t.label}</span>
                  <span className="block text-caption text-muted-foreground">{t.note}</span>
                </div>
                <span
                  className={cn(
                    "ml-auto shrink-0 text-[14px] font-semibold",
                    t.done ? "text-muted-foreground" : "text-primary"
                  )}
                >
                  {t.badge || (t.done ? "記入済み" : "")}
                </span>
              </div>
            );
            return (
              <li key={t.id}>{disabled ? content : <Link href={t.href as string}>{content}</Link>}</li>
            );
          })}
        </ol>

        <div className="mt-4 flex flex-col items-center gap-1.5">
          {allDone ? (
            <Button asChild>
              <Link href="/workshop/guide">
                宿題を提出する
                <Send className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button disabled>
              宿題を提出する
              <Send className="h-4 w-4" />
            </Button>
          )}
          {!allDone && (
            <p className="text-caption text-muted-foreground">
              3つとも記入すると提出できます
              {nextTask && `（次は「${nextTask.label}」）`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
