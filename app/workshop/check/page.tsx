import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { WorksheetStage } from "@/components/worksheet/WorksheetStage";
import { PrintSheet } from "@/components/worksheet/PrintSheet";
import { formatHeaderName } from "@/components/worksheet/SheetHeader";
import { PrintButton } from "@/components/worksheet/PrintButton";
import { ChangeBarChart, type ChangeGroup } from "@/components/worksheet/ChangeBarChart";
import { readSavedReport } from "@/lib/report/generate.server";
import { BRAND } from "@/lib/brand";
import { SECTION_A, SECTION_D } from "@/lib/surveyContent";
import { ReportBody } from "./ReportAnalysis";

/**
 * 受講者レポート（A4横スライド1枚）。設計は docs/REPORT_DESIGN.md を参照。
 * 左: じぶん経営方針（MVV）／§A 6問の事前・事後／§D の方向性（事前→事後）
 * 右: 会社／社会それぞれの「じぶん経営」AI分析文（初回のみ生成し post.report に保存）
 */
type Answers = Record<string, unknown>;

/** §A 各設問のグラフ用ラベル（設問文は長いので短縮する） */
const A_LABELS: Record<string, string> = {
  a1: "自分で切り拓く",
  a2: "考える時間",
  a3: "環境適応",
  a4: "社外での通用",
  a5: "60歳以降の像",
  a6: "期待が大きい",
};

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/**
 * §D の選択肢をレポート表示用に短縮したもの。
 * 元のラベルは最長35字あり、「事前 → 事後」を1行に収められないため。
 */
const D_SHORT_LABELS: Record<string, string> = {
  "1": "定年前に転職・独立",
  "2": "定年を機に転職・独立",
  "3": "雇用延長後に転職・独立",
  "4": "雇用延長し、そこで退職",
  "5": "定年で退職",
  "6": "まだ決めていない",
};

/** §D の回答（value）を短縮ラベルに戻す */
function directionLabel(answers: Answers): string | null {
  const v = answers[SECTION_D.key];
  if (typeof v !== "string" || !v) return null;
  return (
    D_SHORT_LABELS[v] ?? SECTION_D.options.find((o) => o.value === v)?.label ?? v
  );
}

export default async function ReportPage() {
  const session = await getSession();
  if (!session) redirect("/login?from=/workshop/check");

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      name: true,
      workshopData: { select: { pre: true, post: true } },
    },
  });

  const wd = user?.workshopData;
  const pre = ((wd?.pre as { survey?: Answers } | null)?.survey ?? {}) as Answers;
  const post = ((wd?.post as { surveyImmediate?: Answers } | null)?.surveyImmediate ??
    {}) as Answers;

  const ps = (wd?.pre as { profileSlide?: { name?: string; nickname?: string } } | null)
    ?.profileSlide;
  const displayName = (ps?.name ?? user?.name ?? "").trim();
  const headerName = formatHeaderName(displayName, (ps?.nickname ?? "").trim());

  // §A の6問を1問ずつ事前・事後で並べる。
  // 折れ線（母体平均）は出典調査に5段階平均が無いため常に null（docs/REPORT_DESIGN.md §1.3）。
  const groups: ChangeGroup[] = SECTION_A.questions.map((q, i) => ({
    id: q.key,
    no: String(i + 1),
    label: A_LABELS[q.key] ?? q.text,
    pre: num(pre[q.key]),
    post: num(post[q.key]),
    benchmark: null,
  }));

  const direction = { pre: directionLabel(pre), post: directionLabel(post) };

  const savedReport = readSavedReport(wd?.post);

  return (
    <WorksheetStage>
      <div className="no-print flex w-full max-w-[1123px] items-center justify-between gap-3">
        <Link
          href="/workshop/records"
          className="inline-flex items-center gap-1.5 text-sm text-ws-muted hover:text-ws-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          ワーク記録へ戻る
        </Link>
        <PrintButton />
      </div>

      <PrintSheet>
        {/* タイトル行 */}
        <div className="flex items-end justify-between gap-4 border-b border-ws-line pb-3">
          <h1 className="text-2xl font-bold text-ws-ink">
            {BRAND.name}
            <span className="ml-4 text-ws-accent">
              {headerName || displayName || "あなた"} さんレポート
            </span>
          </h1>
          <span className="shrink-0 text-sm font-semibold text-ws-muted">
            株式会社COMMUNITY
          </span>
        </div>

        <p className="mt-3 text-sm text-ws-muted">
          講座の内容をもとにレポートを作成しました。今後の「じぶん経営」にご活用ください。
        </p>

        {/* 左: 方針＋意識の変化 ／ 右: 会社・社会。シート(710px)の残りを埋める */}
        <ReportBody
          name={headerName || displayName || "あなた"}
          initial={savedReport}
          chart={<ChangeBarChart groups={groups} />}
          direction={direction}
        />
      </PrintSheet>
    </WorksheetStage>
  );
}
