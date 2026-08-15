import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Lock,
  Check,
  ArrowRight,
  GraduationCap,
  FileText,
  Sparkles,
  MessageCircleHeart,
} from "lucide-react";
import { getDashboardState } from "@/lib/workshopAccess";
import { PHASE_META_BY_ID, isPhaseAccessible } from "@/lib/phases";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";

/**
 * Program A ダッシュボード（事前・事後の二態切替）。
 * - 事前モード: 事前課題 ＋ 研修本番(B)入口
 * - 事後モード: 事後アンケート ＋ じぶんのワーク記録 ＋ セルフ・チェック
 *   （セルフ・チェックは事前事後の両アンケートが揃ったら有効化）
 * トリガー: statuses.post === "OPEN" もしくは completedPhases に "post"
 *
 * スタイルは globals.css の規定（.nav-card / .icon-chip / .card-eyebrow /
 * .nav-card-title / .nav-card-note / .tag-done）とトークンに従う。
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
          {BRAND.tagline}
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
          {BRAND.name}
        </h1>
        <p className="subtitle mt-2">
          {isPostMode
            ? "研修お疲れさまでした。事後アンケートと、ご自身のワーク記録の入口です。"
            : "事前アンケートと、研修本番（Day1〜）への入口です。"}
        </p>
      </header>

      {!sessionId && (
        <div className="callout mb-6 flex-col gap-1">
          <p className="text-sm text-foreground">研修セッションが未設定です。</p>
          <a
            href={`mailto:${BRAND.contactEmail}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            事務局までお問合せください <ArrowRight className="h-4 w-4" />
          </a>
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
        <Link href="/training" className="nav-card is-feature mt-3">
          <div className="flex items-center gap-4">
            <span className="icon-chip">
              <GraduationCap className="h-5 w-5" />
            </span>
            <div>
              <span className="card-eyebrow">研修本番</span>
              <p className="nav-card-title">Day1・宿題・Day2 へ</p>
              <p className="nav-card-note">
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
        <Link href="/workshop/records" className="nav-card">
          <div className="flex items-center gap-4">
            <span className="icon-chip">
              <FileText className="h-5 w-5" />
            </span>
            <div>
              <span className="card-eyebrow">ふりかえり</span>
              <p className="nav-card-title">じぶんのワーク記録を見る</p>
              <p className="nav-card-note">
                Day1／宿題／Day2 で書いた内容を読み返す（編集はできません）
              </p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-primary" />
        </Link>
      </li>

      <li>
        {checkUnlocked ? (
          <Link href="/workshop/check" className="nav-card">
            <CheckCardInner unlocked />
            <ArrowRight className="h-5 w-5 shrink-0 text-primary" />
          </Link>
        ) : (
          <div aria-disabled className="nav-card is-locked">
            <CheckCardInner unlocked={false} preDone={preDone} postDone={postDone} />
            <Lock className="h-5 w-5 shrink-0 text-muted-foreground" />
          </div>
        )}
      </li>

      <li>
        <Link href="/workshop/followup" className="nav-card">
          <div className="flex items-center gap-4">
            <span className="icon-chip">
              <MessageCircleHeart className="h-5 w-5" />
            </span>
            <div>
              <span className="card-eyebrow">3 ヶ月後</span>
              <p className="nav-card-title">近況のお伺い</p>
              <p className="nav-card-note">
                研修で書いた「社会」「会社」のテーマについて、今の動きを振り返る（所要約3分）
              </p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-primary" />
        </Link>
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
      <span className={cn("icon-chip", !unlocked && "is-muted")}>
        <Sparkles className="h-5 w-5" />
      </span>
      <div>
        <span className="card-eyebrow">セルフ・チェック</span>
        <p className="nav-card-title">事前と事後で見比べる</p>
        <p className="nav-card-note">{hint}</p>
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
    <div className={cn("nav-card", !accessible && "is-locked")}>
      <div className="flex items-center gap-4">
        <span
          className={cn(
            "icon-chip text-sm font-bold",
            done ? "is-solid" : !accessible && "is-muted"
          )}
        >
          {numberOrCheck === "check" ? <Check className="h-4 w-4" /> : numberOrCheck}
        </span>
        <div>
          <div className="flex items-center gap-2">
            <span className="card-eyebrow">{day}</span>
            {done && <span className="tag-done">完了</span>}
          </div>
          <p className="nav-card-title">{label}</p>
          <p className="nav-card-note">{description}</p>
        </div>
      </div>
      {accessible ? (
        <ArrowRight className="h-5 w-5 shrink-0 text-primary" />
      ) : (
        <Lock className="h-5 w-5 shrink-0 text-muted-foreground" />
      )}
    </div>
  );
  return accessible ? (
    <Link href={href}>{card}</Link>
  ) : (
    <div aria-disabled className="cursor-not-allowed">
      {card}
    </div>
  );
}
