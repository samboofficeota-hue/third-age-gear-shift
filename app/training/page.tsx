import Link from "next/link";
import { redirect } from "next/navigation";
import { Lock, Check, ArrowRight, ArrowLeft, UserCircle } from "lucide-react";
import { getDashboardState } from "@/lib/workshopAccess";
import { PHASE_META, isPhaseAccessible } from "@/lib/phases";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";

/**
 * 研修本番（Program B）ダッシュボード。白基調。
 * Day1 / 宿題 / Day2 を講師の開放状況に応じて表示する。
 */
export default async function TrainingDashboard() {
  const state = await getDashboardState();
  if (!state) redirect("/login?from=/training");

  const { sessionId, completedPhases, statuses } = state;
  const phases = PHASE_META.filter((p) => p.program === "B");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-8">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-ws-teal">
          研修本番
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ws-ink">
          Day1・宿題・Day2
        </h1>
        <p className="mt-2 text-sm text-ws-muted">
          講師が進行に合わせて各ワークを開放します。開放されたものから取り組みましょう。
        </p>
      </header>

      {!sessionId && (
        <div className="mb-6 rounded-lg border border-ws-line bg-white p-4">
          <p className="text-sm text-ws-ink">研修セッションが未設定です。</p>
          <a
            href={`mailto:${BRAND.contactEmail}`}
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-ws-teal hover:underline"
          >
            事務局までお問合せください <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      )}

      {/* じぶん紹介（事前に作成・Day1で発表）＝Program B内の読み取り専用ビュー */}
      <Link
        href="/training/intro"
        className="mb-3 flex items-center gap-3 rounded-xl border border-ws-line bg-white p-4 transition-colors hover:border-ws-teal"
      >
        <UserCircle className="h-5 w-5 shrink-0 text-ws-teal" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ws-ink">じぶん紹介</p>
          <p className="text-xs text-ws-muted">
            事前に作成したシート（Day1で発表）
          </p>
        </div>
        <ArrowRight className="ml-auto h-5 w-5 shrink-0 text-ws-teal" />
      </Link>

      <ol className="space-y-3">
        {phases.map((p, i) => {
          const status = statuses[p.id];
          const accessible = isPhaseAccessible(p, status);
          const done = completedPhases.includes(p.id);

          const card = (
            <div
              className={cn(
                "flex items-center justify-between gap-4 rounded-xl border p-4 transition-colors",
                accessible
                  ? "border-ws-line bg-white hover:border-ws-teal"
                  : "border-ws-line bg-ws-fill opacity-60"
              )}
            >
              <div className="flex items-center gap-4">
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                    done
                      ? "bg-ws-teal text-white"
                      : accessible
                        ? "bg-ws-mint text-ws-teal"
                        : "bg-ws-fill text-ws-muted"
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-ws-muted">
                      {p.day}
                    </span>
                    {done && (
                      <span className="rounded bg-ws-mint px-1.5 py-0.5 text-[10px] font-medium text-ws-teal">
                        完了
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-ws-ink">{p.label}</p>
                  <p className="text-xs text-ws-muted">{p.description}</p>
                </div>
              </div>
              {accessible ? (
                <ArrowRight className="h-5 w-5 shrink-0 text-ws-teal" />
              ) : (
                <Lock className="h-5 w-5 shrink-0 text-ws-muted" />
              )}
            </div>
          );

          return (
            <li key={p.id}>
              {accessible ? (
                <Link href={p.route}>{card}</Link>
              ) : (
                <div aria-disabled className="cursor-not-allowed">
                  {card}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-8">
        <Link
          href="/workshop"
          className="inline-flex items-center gap-1.5 text-xs text-ws-muted hover:text-ws-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          事前・事後（アンケート）へ
        </Link>
      </div>
    </div>
  );
}
