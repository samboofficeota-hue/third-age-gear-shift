import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ArrowLeft, FileText, Lock } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";

/**
 * 自分のワーク記録 一覧（事後の振り返り入口）。
 * Day1／宿題／Day2 の入力有無と最終更新を表示し、閲覧モードで該当シートを開く。
 * 閲覧は ?mode=view クエリ経由で既存ワークシートを read-only 再利用。
 */
type RecordEntry = {
  id: "day1" | "homework" | "day2";
  label: string;
  description: string;
  route: string;
  hasData: boolean;
};

function isFilled(j: unknown): boolean {
  if (!j || typeof j !== "object") return false;
  // 何かしらのキーに値が入っていれば「記入あり」と判定
  return Object.keys(j as Record<string, unknown>).length > 0;
}

export default async function RecordsPage() {
  const session = await getSession();
  if (!session) redirect("/login?from=/workshop/records");

  const wd = await prisma.workshopData.findUnique({
    where: { userId: session.sub },
    select: {
      day1: true,
      homework: true,
      day2: true,
      lastUpdated: true,
    },
  });

  const entries: RecordEntry[] = [
    {
      id: "day1",
      label: "Day 1：じぶん分解・じぶん分析",
      description: "分人シェア表／マイ・ポートフォリオ／好き・得意マトリクス／社会との接点",
      route: "/training/day1?mode=view",
      hasData: isFilled(wd?.day1),
    },
    {
      id: "homework",
      label: "宿題：みらいシナリオ",
      description: "会社編／社会編（穴埋め）",
      route: "/workshop/homework/scenario?mode=view",
      hasData: isFilled(wd?.homework),
    },
    {
      id: "day2",
      label: "Day 2：ビジョン・資本・シフト戦略",
      description: "マイ・ポートフォリオ 2.0→3.0／Will・Can・Must／アクションプラン",
      route: "/training/day2?mode=view",
      hasData: isFilled(wd?.day2),
    },
  ];

  const lastUpdated = wd?.lastUpdated
    ? new Intl.DateTimeFormat("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(wd.lastUpdated)
    : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-8">
      <header className="mb-8">
        <Link
          href="/workshop"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-[#e0f0e8]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          ダッシュボードへ
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-[#e0f0e8]">
          じぶんのワーク記録
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          研修で書いた内容を読み返せます。閲覧モードでの表示です（編集はできません）。
          印刷ボタンから PDF として保存することもできます。
        </p>
        {lastUpdated && (
          <p className="mt-1 text-xs text-muted-foreground">
            最終更新: {lastUpdated}
          </p>
        )}
      </header>

      <ul className="space-y-3">
        {entries.map((e) => {
          const card = (
            <div
              className={cn(
                "flex items-center justify-between gap-4 rounded-xl border p-4 transition-colors",
                e.hasData
                  ? "border-[rgba(0,255,136,0.25)] bg-[#141a2a] hover:border-primary"
                  : "border-[rgba(255,255,255,0.06)] bg-[#0f1420] opacity-60"
              )}
            >
              <div className="flex items-center gap-4">
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    e.hasData
                      ? "bg-primary/15 text-primary"
                      : "bg-[#1a2030] text-muted-foreground"
                  )}
                >
                  <FileText className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#e0f0e8]">{e.label}</p>
                  <p className="text-xs text-muted-foreground">{e.description}</p>
                  {!e.hasData && (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      （まだ記入がありません）
                    </p>
                  )}
                </div>
              </div>
              {e.hasData ? (
                <ArrowRight className="h-5 w-5 shrink-0 text-primary" />
              ) : (
                <Lock className="h-5 w-5 shrink-0 text-muted-foreground" />
              )}
            </div>
          );

          return (
            <li key={e.id}>
              {e.hasData ? (
                <Link href={e.route}>{card}</Link>
              ) : (
                <div aria-disabled className="cursor-not-allowed">
                  {card}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
