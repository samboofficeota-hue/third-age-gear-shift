import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ArrowLeft, FileText, BarChart3 } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * 自分のワーク記録・レポートの入口。2枚の大きめカードのみ：
 * - ワーク一覧をみる: /workshop/records/download（全ワークをread-only表示＋PDF保存）
 * - レポートをみる: /workshop/check（事前・事後アンケート比較。AIコメント等は今後拡張予定）
 * Day1／宿題／Day2 を個別に選ぶ導線は廃止（ワーク一覧側に統合済み）。
 */
export default async function RecordsPage() {
  const session = await getSession();
  if (!session) redirect("/login?from=/workshop/records");

  const wd = await prisma.workshopData.findUnique({
    where: { userId: session.sub },
    select: { lastUpdated: true },
  });

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
          href="/workshop/guide"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-[#e0f0e8]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          ガイドへ戻る
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-[#e0f0e8]">
          じぶんのワーク記録
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          研修で書いた内容を読み返せます。閲覧モードでの表示です（編集はできません）。
        </p>
        {lastUpdated && (
          <p className="mt-1 text-xs text-muted-foreground">
            最終更新: {lastUpdated}
          </p>
        )}
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/workshop/records/download"
          className="flex flex-col gap-4 rounded-2xl border border-[rgba(0,255,136,0.25)] bg-[#141a2a] p-6 transition-colors hover:border-primary"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-primary">
            <FileText className="h-5 w-5" />
          </span>
          <div>
            <p className="text-base font-bold text-[#e0f0e8]">ワーク一覧をみる</p>
            <p className="mt-1 text-sm text-muted-foreground">
              じぶん紹介〜Day2まで、書いた内容をまとめて読み返せます。PDFで保存も可能です。
            </p>
          </div>
          <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-primary">
            開く <ArrowRight className="h-4 w-4" />
          </span>
        </Link>

        <Link
          href="/workshop/check"
          className="flex flex-col gap-4 rounded-2xl border border-[rgba(0,255,136,0.25)] bg-[#141a2a] p-6 transition-colors hover:border-primary"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-primary">
            <BarChart3 className="h-5 w-5" />
          </span>
          <div>
            <p className="text-base font-bold text-[#e0f0e8]">レポートをみる</p>
            <p className="mt-1 text-sm text-muted-foreground">
              事前・事後アンケートを見比べて、変化を振り返ります。
            </p>
          </div>
          <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-primary">
            開く <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </div>
    </div>
  );
}
