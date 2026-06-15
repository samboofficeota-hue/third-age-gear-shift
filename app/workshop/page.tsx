import Link from "next/link";
import { redirect } from "next/navigation";
import { Lock, Check, ArrowRight } from "lucide-react";
import { getDashboardState } from "@/lib/workshopAccess";
import { PHASE_META, isPhaseAccessible } from "@/lib/phases";
import { cn } from "@/lib/utils";

export default async function WorkshopDashboard() {
  const state = await getDashboardState();
  if (!state) redirect("/login?from=/workshop");

  const { sessionId, completedPhases, statuses } = state;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-8">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          ミドルシニア社員向け　キャリア戦略プログラム
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#e0f0e8]">
          サードエイジ じぶん戦略講座
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          講師が各フェーズを順に開放します。開放された課題から取り組みましょう。
        </p>
      </header>

      {!sessionId && (
        <div className="mb-6 rounded-lg border border-[rgba(0,255,136,0.25)] bg-[#141a2a] p-4">
          <p className="text-sm text-[#e0f0e8]">
            研修コードがまだ未登録です。
          </p>
          <Link
            href="/workshop/join"
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            研修コードを入力する <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      <ol className="space-y-3">
        {PHASE_META.map((p, i) => {
          const status = statuses[p.id];
          const accessible = isPhaseAccessible(p, status);
          const done = completedPhases.includes(p.id);

          const card = (
            <div
              className={cn(
                "flex items-center justify-between gap-4 rounded-xl border p-4 transition-colors",
                accessible
                  ? "border-[rgba(0,255,136,0.25)] bg-[#141a2a] hover:border-primary"
                  : "border-[rgba(255,255,255,0.06)] bg-[#0f1420] opacity-60"
              )}
            >
              <div className="flex items-center gap-4">
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                    done
                      ? "bg-primary text-primary-foreground"
                      : accessible
                        ? "bg-primary/15 text-primary"
                        : "bg-[#1a2030] text-muted-foreground"
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {p.day}
                    </span>
                    {done && (
                      <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                        完了
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-[#e0f0e8]">{p.label}</p>
                  <p className="text-xs text-muted-foreground">{p.description}</p>
                </div>
              </div>
              {accessible ? (
                <ArrowRight className="h-5 w-5 shrink-0 text-primary" />
              ) : (
                <Lock className="h-5 w-5 shrink-0 text-muted-foreground" />
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
