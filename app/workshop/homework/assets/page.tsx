import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canAccessPhase } from "@/lib/workshopAccess";
import { cn } from "@/lib/utils";
import { ASSET_KEYS, ASSET_META, hasText, type AssetsData } from "@/lib/homework/assets/meta";
import { LifeLineModal } from "@/components/worksheet/LifeLineModal";
import type { LifeCurvePoint } from "@/app/workshop/pre/life-plan/_types";

/**
 * 宿題(c) じぶん資産表（Program A＝個別・非同期）。講師が開放したときのみアクセス可。
 * 扉ページ：生産性資産／活力資産／変身資産の3枚へ振り分ける。
 */
export default async function HomeworkAssetsPage() {
  const session = await getSession();
  if (!session) redirect("/login?from=/workshop/homework/assets");

  const { ok } = await canAccessPhase("homework");
  if (!ok) redirect("/workshop/homework");

  const wd = await prisma.workshopData.findUnique({
    where: { userId: session.sub },
    select: { homework: true, pre: true },
  });
  const assets = (wd?.homework as { assets?: AssetsData } | null)?.assets;
  const lifeCurvePoints =
    (wd?.pre as { lifeCurve?: { points?: LifeCurvePoint[] } } | null)?.lifeCurve?.points ?? [];
  const allDone = ASSET_KEYS.every((k) => hasText(assets?.[k]));

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:px-6">
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <p className="eyebrow">宿題</p>
        <p className="mt-1 text-lg font-bold text-foreground">じぶん資産表を作ろう</p>
        <p className="mt-2 text-sm leading-relaxed text-secondary-foreground">
          Day 1のワークや対話を通じて、自分を振り返るドアが開き始めました。
          <br />
          ここからは、じぶんが今もっている「資産を評価」していきます。
          <br />
          経験・知見・関係などをもとに、どんな資産があるか、その価値は何か。
          <br />
          次の3つの無形資産に分けて、自分の言葉として書き出してみましょう。
        </p>

        <div className="mt-4 flex justify-center">
          <LifeLineModal points={lifeCurvePoints} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {ASSET_KEYS.map((key) => {
            const meta = ASSET_META[key];
            const done = hasText(assets?.[key]);
            return (
              <Link
                key={key}
                href={`/workshop/homework/assets/${key}`}
                // 入力済みは薄くせず、緑の枠＋「入力済み」で示す（みらいシナリオの扉と同じ見せ方）。
                // 薄くすると「押せない」ように見え、未入力との違いも分かりにくかったため。
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-colors",
                  done
                    ? "border-primary/60 bg-primary/10 hover:border-primary"
                    : "border-dashed border-border bg-bg-panel hover:border-primary/50"
                )}
              >
                <span
                  className="flex h-16 w-16 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: meta.color }}
                >
                  {meta.label.slice(0, 2)}
                </span>
                <span className="text-sm font-bold text-foreground">{meta.label}</span>
                {done ? (
                  <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    入力済み
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">未入力</span>
                )}
              </Link>
            );
          })}
        </div>

        {/* 3つとも書き終えたら、区切りとして宿題一覧への戻り導線を出す（みらいシナリオの扉と同じ）。 */}
        {allDone && (
          <div className="mt-6 flex flex-col items-center gap-3 border-t border-border pt-6">
            <p className="flex items-center gap-1.5 text-sm text-secondary-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              3つの資産、すべて書き終えました
            </p>
            <Button asChild>
              <Link href="/workshop/homework">
                <ArrowLeft className="h-4 w-4" />
                宿題の一覧へ戻る
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
