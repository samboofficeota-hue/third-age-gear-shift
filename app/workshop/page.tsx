import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Lock,
  Check,
  ArrowRight,
  GraduationCap,
  FileText,
  Sparkles,
} from "lucide-react";
import { getDashboardState } from "@/lib/workshopAccess";
import { PHASE_META_BY_ID, isPhaseAccessible } from "@/lib/phases";
import { cn } from "@/lib/utils";

/**
 * Program A ダッシュボード（事前・事後の二態切替）。
 * - 事前モード: 事前課題 ＋ 研修本番(B)入口
 * - 事後モード: 事後アンケート ＋ じぶんのワーク記録 ＋ セルフ・チェック
 *   （セルフ・チェックは事前事後の両アンケートが揃ったら有効化）
 * トリガー: statuses.post === "OPEN" もしくは completedPhases に "post"
 */
export default async function WorkshopDashboard() {
  const state = await getDashboardState();
  if (!state) redirect("/login?from=/workshop");

  const { sessionId, completedPhases, statuses } = state;

  const preMeta = PHASE_META_BY_ID.pre;
  const postMeta = PHASE_META_BY_ID.post;

  const preAccessible = isPhaseAccessible(preMeta, statuses.pre);
  const postAccessible = isPhaseAccessible(postMeta, statuses.post);
  const preDone = completedPhases.includes("pre");
  const postDone = completedPhases.includes("post");
  const isPostMode = postAccessible || postDone;

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
          {isPostMode
            ? "研修お疲れさまでした。事後アンケートと、ご自身のワーク記録の入口です。"
            : "事前アンケートと、研修本番（Day1〜）への入口です。"}
        </p>
      </header>

      {!sessionId && (
        <div className="mb-6 rounded-lg border border-[rgba(0,255,136,0.25)] bg-[#141a2a] p-4">
          <p className="text-sm text-[#e0f0e8]">研修コードがまだ未登録です。</p>
          <Link
            href="/workshop/join"
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            研修コードを入力する <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {isPostMode ? (
        <PostModeMenu postAccessible={postAccessible} postDone={postDone} preDone={preDone} />
      ) : (
        <PreModeMenu preAccessible={preAccessible} preDone={preDone} />
      )}
    </div>
  );
}

function PreModeMenu({
  preAccessible,
  preDone,
}: {
  preAccessible: boolean;
  preDone: boolean;
}) {
  const preMeta = PHASE_META_BY_ID.pre;
  return (
    <ol className="space-y-3">
      <li>
        <PhaseCard
          numberOrCheck={preDone ? "check" : 1}
          day={preMeta.day}
          label={preMeta.label}
          description={preMeta.description}
          accessible={preAccessible}
          done={preDone}
          href={preMeta.route}
        />
        <Link
          href="/training"
          className="mt-3 flex items-center justify-between gap-4 rounded-xl border border-primary/40 bg-primary/10 p-4 transition-colors hover:border-primary"
        >
          <div className="flex items-center gap-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
              <GraduationCap className="h-5 w-5" />
            </span>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                研修本番
              </span>
              <p className="text-sm font-semibold text-[#e0f0e8]">Day1・宿題・Day2 へ</p>
              <p className="text-xs text-muted-foreground">
                研修当日はこちらから（白い画面に切り替わります）
              </p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-primary" />
        </Link>
      </li>
    </ol>
  );
}

function PostModeMenu({
  postAccessible,
  postDone,
  preDone,
}: {
  postAccessible: boolean;
  postDone: boolean;
  preDone: boolean;
}) {
  const postMeta = PHASE_META_BY_ID.post;
  const checkUnlocked = preDone && postDone;

  return (
    <ol className="space-y-3">
      <li>
        <PhaseCard
          numberOrCheck={postDone ? "check" : 1}
          day={postMeta.day}
          label={postMeta.label}
          description={postMeta.description}
          accessible={postAccessible}
          done={postDone}
          href={postMeta.route}
        />
      </li>

      <li>
        <Link
          href="/workshop/records"
          className="flex items-center justify-between gap-4 rounded-xl border border-[rgba(0,255,136,0.25)] bg-[#141a2a] p-4 transition-colors hover:border-primary"
        >
          <div className="flex items-center gap-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
              <FileText className="h-5 w-5" />
            </span>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                ふりかえり
              </span>
              <p className="text-sm font-semibold text-[#e0f0e8]">
                じぶんのワーク記録を見る
              </p>
              <p className="text-xs text-muted-foreground">
                Day1／宿題／Day2 で書いた内容を読み返す（編集はできません）
              </p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-primary" />
        </Link>
      </li>

      <li>
        {checkUnlocked ? (
          <Link
            href="/workshop/check"
            className="flex items-center justify-between gap-4 rounded-xl border border-[rgba(0,255,136,0.25)] bg-[#141a2a] p-4 transition-colors hover:border-primary"
          >
            <CheckCardInner unlocked />
            <ArrowRight className="h-5 w-5 shrink-0 text-primary" />
          </Link>
        ) : (
          <div
            aria-disabled
            className="flex cursor-not-allowed items-center justify-between gap-4 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0f1420] p-4 opacity-60"
          >
            <CheckCardInner unlocked={false} preDone={preDone} postDone={postDone} />
            <Lock className="h-5 w-5 shrink-0 text-muted-foreground" />
          </div>
        )}
      </li>
    </ol>
  );
}

function CheckCardInner({
  unlocked,
  preDone,
  postDone,
}: {
  unlocked: boolean;
  preDone?: boolean;
  postDone?: boolean;
}) {
  const hint = unlocked
    ? "事前・事後の回答を並べて、変化を自分で確認できます"
    : !postDone
      ? "事後アンケートに回答すると有効になります"
      : !preDone
        ? "事前アンケートが未回答です"
        : "";
  return (
    <div className="flex items-center gap-4">
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          unlocked ? "bg-primary/15 text-primary" : "bg-[#1a2030] text-muted-foreground"
        )}
      >
        <Sparkles className="h-5 w-5" />
      </span>
      <div>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          セルフ・チェック
        </span>
        <p className="text-sm font-semibold text-[#e0f0e8]">事前と事後で見比べる</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}

function PhaseCard({
  numberOrCheck,
  day,
  label,
  description,
  accessible,
  done,
  href,
}: {
  numberOrCheck: number | "check";
  day: string;
  label: string;
  description: string;
  accessible: boolean;
  done: boolean;
  href: string;
}) {
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
          {numberOrCheck === "check" ? <Check className="h-4 w-4" /> : numberOrCheck}
        </span>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {day}
            </span>
            {done && (
              <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                完了
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-[#e0f0e8]">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {accessible ? (
        <ArrowRight className="h-5 w-5 shrink-0 text-primary" />
      ) : (
        <Lock className="h-5 w-5 shrink-0 text-muted-foreground" />
      )}
    </div>
  );
  return accessible ? <Link href={href}>{card}</Link> : <div aria-disabled className="cursor-not-allowed">{card}</div>;
}
