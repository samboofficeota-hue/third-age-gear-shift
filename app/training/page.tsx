import Link from "next/link";
import { redirect } from "next/navigation";
import { Lock, Check, ArrowRight, UserCircle } from "lucide-react";
import { getDashboardState } from "@/lib/workshopAccess";
import { PHASE_META, PHASE_META_BY_ID, isPhaseAccessible } from "@/lib/phases";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";

/**
 * 研修本番（Program B）ダッシュボード。白基調。
 * Day1 / 宿題 / Day2 を講師の開放状況に応じて表示する。
 */
export default async function TrainingDashboard() {
  const state = await getDashboardState();
  if (!state) redirect("/login?from=/training");

  const { sessionId, statuses } = state;
  const phases = PHASE_META.filter((p) => p.program === "B");
  const preMeta = PHASE_META_BY_ID.pre;
  const preAccessible = isPhaseAccessible(preMeta, statuses.pre);

  return (
    <div className="mx-auto max-w-3xl px-4 py-4 md:px-8">
      <header className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-ws-teal">
          研修当日用
        </p>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-ws-ink">
          講座全体ガイド
        </h1>
        <p className="mt-1.5 text-sm text-ws-muted">
          ここが講座全体を通じたポータルページとなります。
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

      {/* 事前課題（事前アンケート・自己紹介スライド・ライフラインチャート）＝Program B内の読み取り専用ビュー */}
      <Link
        href="/training/intro"
        className="mb-2 flex items-center gap-3 rounded-xl border border-ws-line bg-white p-2.5 transition-colors hover:border-ws-teal"
      >
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            preAccessible ? "bg-ws-teal text-white" : "bg-ws-fill text-ws-muted"
          )}
        >
          {preAccessible ? <Check className="h-4 w-4" /> : <UserCircle className="h-4 w-4" />}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ws-ink">{preMeta.label}</p>
          <p className="text-xs text-ws-muted">{preMeta.description}</p>
        </div>
        <ArrowRight className="ml-auto h-5 w-5 shrink-0 text-ws-teal" />
      </Link>

      <ol className="space-y-1.5">
        {phases.map((p, i) => {
          const status = statuses[p.id];
          const accessible = isPhaseAccessible(p, status);

          const card = (
            <div
              className={cn(
                "flex items-center justify-between gap-4 rounded-xl border p-2.5 transition-colors",
                accessible
                  ? "border-ws-line bg-white hover:border-ws-teal"
                  : "border-ws-line bg-ws-fill opacity-60"
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                    accessible
                      ? "bg-ws-teal text-white"
                      : "bg-ws-fill text-ws-muted"
                  )}
                >
                  {accessible ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <div>
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
    </div>
  );
}
