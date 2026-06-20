import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  SECTION_A,
  SECTION_B,
  SECTION_C,
  SECTION_D,
  SECTION_E,
  POST_FREETEXT,
  REASON_TENSHOKU,
  REASON_KOYOU,
  CHALLENGE_CHUSHO,
  SUPPORT,
  type ScaleSection,
  type ChoiceQuestion,
} from "@/lib/surveyContent";
import { cn } from "@/lib/utils";

/**
 * セルフ・チェック（事前・事後の比較）。
 * §A〜C のスケール設問は数値差分を、§D 関連は選択肢ラベルを並べて表示。
 * §E は事後のみ（5問）、自由記述は事後テキスト。
 */
type Answers = Record<string, unknown>;

const SCALE_SECTIONS: ScaleSection[] = [SECTION_A, SECTION_B, SECTION_C];
const D_REASONS: ChoiceQuestion[] = [
  REASON_TENSHOKU,
  REASON_KOYOU,
  CHALLENGE_CHUSHO,
  SUPPORT,
];

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v : null;
}

function labelFor(q: ChoiceQuestion, value: string | null): string | null {
  if (!value) return null;
  return q.options.find((o) => o.value === value)?.label ?? value;
}

function labelsFor(q: ChoiceQuestion, values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return values
    .map((v) => q.options.find((o) => o.value === v)?.label ?? String(v))
    .filter(Boolean);
}

export default async function CheckPage() {
  const session = await getSession();
  if (!session) redirect("/login?from=/workshop/check");

  const wd = await prisma.workshopData.findUnique({
    where: { userId: session.sub },
    select: { pre: true, post: true },
  });

  const pre = (wd?.pre as { survey?: Answers } | null)?.survey ?? {};
  const post =
    ((wd?.post as { surveyImmediate?: Answers } | null)?.surveyImmediate ?? {}) as Answers;

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
          セルフ・チェック
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          事前と事後のアンケート回答を並べて、ご自身の変化を眺めてみましょう。
        </p>
      </header>

      <div className="space-y-10">
        {/* §A〜C 5段階リッカートの比較 */}
        {SCALE_SECTIONS.map((section) => (
          <section key={section.id}>
            <h2 className="mb-3 text-lg font-bold text-primary">
              §{section.id}　{section.title}
            </h2>
            <ScaleTable section={section} pre={pre} post={post} />
          </section>
        ))}

        {/* §D 単一選択（事前事後で同じ設問群） */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-primary">
            §D　{SECTION_D.title}
          </h2>
          <ChoiceRow q={SECTION_D} pre={pre} post={post} />
          {D_REASONS.map((q) => {
            const preVal = pre[q.key];
            const postVal = post[q.key];
            if (preVal == null && postVal == null) return null;
            return q.key === SUPPORT.key ? (
              <MultiChoiceRow key={q.key} q={q} pre={pre} post={post} />
            ) : (
              <ChoiceRow key={q.key} q={q} pre={pre} post={post} />
            );
          })}
        </section>

        {/* §E 研修評価（事後のみ） */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-primary">
            §{SECTION_E.id}　{SECTION_E.title}
            <span className="ml-2 text-xs font-medium text-muted-foreground">
              （事後のみ）
            </span>
          </h2>
          <div className="overflow-hidden rounded-xl border border-[rgba(0,255,136,0.18)]">
            <table className="w-full text-sm">
              <thead className="bg-[#141a2a] text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">設問</th>
                  <th className="w-24 px-3 py-2 text-right font-semibold">事後</th>
                </tr>
              </thead>
              <tbody>
                {SECTION_E.questions.map((q) => (
                  <tr key={q.key} className="border-t border-[rgba(255,255,255,0.06)]">
                    <td className="px-3 py-2 text-[#e0f0e8]">{q.text}</td>
                    <td className="px-3 py-2 text-right font-bold text-primary">
                      {num(post[q.key]) ?? "—"}
                      {q.kind === "nps" && num(post[q.key]) !== null && (
                        <span className="ml-1 text-[10px] font-normal text-muted-foreground">/10</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 自由記述（事後のみ） */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-primary">
            自由記述
            <span className="ml-2 text-xs font-medium text-muted-foreground">
              （事後のみ）
            </span>
          </h2>
          <p className="text-xs text-muted-foreground">{POST_FREETEXT.label}</p>
          <div className="mt-2 whitespace-pre-wrap rounded-xl border border-[rgba(0,255,136,0.18)] bg-[#141a2a] p-4 text-sm text-[#e0f0e8]">
            {str(post[POST_FREETEXT.key]) ?? (
              <span className="text-muted-foreground">（未記入）</span>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function ScaleTable({
  section,
  pre,
  post,
}: {
  section: ScaleSection;
  pre: Answers;
  post: Answers;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[rgba(0,255,136,0.18)]">
      <table className="w-full text-sm">
        <thead className="bg-[#141a2a] text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left font-semibold">設問</th>
            <th className="w-16 px-3 py-2 text-right font-semibold">事前</th>
            <th className="w-16 px-3 py-2 text-right font-semibold">事後</th>
            <th className="w-16 px-3 py-2 text-right font-semibold">差分</th>
          </tr>
        </thead>
        <tbody>
          {section.questions.map((q) => {
            const a = num(pre[q.key]);
            const b = num(post[q.key]);
            const diff = a !== null && b !== null ? b - a : null;
            return (
              <tr key={q.key} className="border-t border-[rgba(255,255,255,0.06)]">
                <td className="px-3 py-2 text-[#e0f0e8]">{q.text}</td>
                <td className="px-3 py-2 text-right text-muted-foreground">
                  {a ?? "—"}
                </td>
                <td className="px-3 py-2 text-right font-bold text-[#e0f0e8]">
                  {b ?? "—"}
                </td>
                <td className="px-3 py-2 text-right">
                  <DeltaBadge diff={diff} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DeltaBadge({ diff }: { diff: number | null }) {
  if (diff === null)
    return <span className="text-xs text-muted-foreground">—</span>;
  if (diff > 0)
    return (
      <span className="inline-flex items-center gap-0.5 rounded bg-primary/15 px-1.5 py-0.5 text-xs font-bold text-primary">
        <TrendingUp className="h-3 w-3" />+{diff}
      </span>
    );
  if (diff < 0)
    return (
      <span className="inline-flex items-center gap-0.5 rounded bg-rose-500/15 px-1.5 py-0.5 text-xs font-bold text-rose-300">
        <TrendingDown className="h-3 w-3" />
        {diff}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-0.5 rounded bg-[#1a2030] px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
      <Minus className="h-3 w-3" />0
    </span>
  );
}

function ChoiceRow({
  q,
  pre,
  post,
}: {
  q: ChoiceQuestion;
  pre: Answers;
  post: Answers;
}) {
  const a = labelFor(q, str(pre[q.key]));
  const b = labelFor(q, str(post[q.key]));
  const changed = a !== null && b !== null && a !== b;
  return (
    <div className="mt-3 rounded-xl border border-[rgba(0,255,136,0.18)] bg-[#141a2a] p-4">
      <p className="text-xs font-semibold text-primary">{q.title}</p>
      <p className="mt-1 text-sm text-[#e0f0e8]">{q.text}</p>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            事前
          </span>
          <p className="mt-0.5 text-[#c8dccf]">{a ?? "（未回答）"}</p>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            事後
          </span>
          <p
            className={cn(
              "mt-0.5 font-semibold",
              changed ? "text-primary" : "text-[#c8dccf]"
            )}
          >
            {b ?? "（未回答）"}
          </p>
        </div>
      </div>
    </div>
  );
}

function MultiChoiceRow({
  q,
  pre,
  post,
}: {
  q: ChoiceQuestion;
  pre: Answers;
  post: Answers;
}) {
  const a = labelsFor(q, pre[q.key]);
  const b = labelsFor(q, post[q.key]);
  return (
    <div className="mt-3 rounded-xl border border-[rgba(0,255,136,0.18)] bg-[#141a2a] p-4">
      <p className="text-xs font-semibold text-primary">{q.title}</p>
      <p className="mt-1 text-sm text-[#e0f0e8]">{q.text}</p>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            事前
          </span>
          <ul className="mt-0.5 space-y-0.5 text-[#c8dccf]">
            {a.length ? a.map((l) => <li key={l}>・{l}</li>) : <li>（未回答）</li>}
          </ul>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            事後
          </span>
          <ul className="mt-0.5 space-y-0.5 text-[#c8dccf]">
            {b.length ? b.map((l) => <li key={l}>・{l}</li>) : <li>（未回答）</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
