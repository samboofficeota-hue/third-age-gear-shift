import { INVITE_TTL_DAYS } from "@/lib/invite";
import type { TemplateContext, TemplateKey } from "@/lib/emailTemplates";

/**
 * 宛先ユーザー＋セッションから、テンプレートに渡す TemplateContext を組み立てる。
 * 「このテンプレートはこのリンクに飛ばす」という対応をここ1箇所に閉じ込める。
 */

/**
 * テンプレートごとの遷移先。invite はコホート専用の入口（/c/<研修コード>）なので null（研修コードから作る）。
 * 入口からログイン画面へ進み、登録済みのメールアドレスでマジックリンクを受け取って入る。
 */
const ACTION_PATH: Record<TemplateKey, string | null> = {
  invite: null, // appUrl(`/c/${code}`)
  day1_info: null, // appUrl(`/c/${code}`)（当日案内も受講ページへ）
  reminder_pre: "/login",
  completion: "/workshop",
  followup_3m: "/workshop/followup",
};

export function appUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  return `${base}${path}`;
}

/** Date → "2026年9月3日(水)"。未設定は null（メール本文から行ごと消える）。 */
export function formatJpDate(d: Date | null | undefined): string | null {
  if (!d) return null;
  return new Date(d).toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

export type ContextUser = {
  email: string;
  name: string | null;
  inviteToken: string | null;
  activatedAt: Date | null;
};

export type ContextSession = {
  name: string | null;
  code: string;
  startTime: string | null;
  endTime: string | null;
  venueAddress: string | null;
  day1Date: Date | null;
  day2Date: Date | null;
  location: string | null;
  isOnline: boolean;
};

export type ContextResult =
  | { ok: true; context: TemplateContext }
  | { ok: false; reason: string };

export function buildContext(
  template: TemplateKey,
  user: ContextUser,
  session: ContextSession | null
): ContextResult {
  let actionUrl: string;

  if (template === "invite") {
    // 有効化済みの人に招待を送り直すと、本人が混乱するだけなので送らない
    if (user.activatedAt) {
      return { ok: false, reason: "すでにアカウント有効化済みです" };
    }
    if (!session) {
      return { ok: false, reason: "研修が見つかりません" };
    }
    actionUrl = cohortUrl(session.code);
  } else if (template === "day1_info") {
    // 当日案内は、まだログインしていない人にも届ける（受講ページから入れる）
    if (!session) {
      return { ok: false, reason: "研修が見つかりません" };
    }
    actionUrl = cohortUrl(session.code);
  } else {
    // 招待以外は本人がログインして開く画面。未有効化の人には届いても入れない
    if (!user.activatedAt) {
      return { ok: false, reason: "まだアカウントが有効化されていません" };
    }
    actionUrl = appUrl(ACTION_PATH[template]!);
  }

  return {
    ok: true,
    context: { name: user.name?.trim() || "ご参加者", actionUrl, ...sessionContext(session) },
  };
}

/** コホート専用の入口 URL（/c/<研修コード>） */
function cohortUrl(code: string): string {
  return appUrl(`/c/${encodeURIComponent(code)}`);
}

/** 開催時刻の表示（例: "13:30〜17:00"）。両方未設定なら null */
function formatTimeRange(start: string | null, end: string | null): string | null {
  if (!start && !end) return null;
  return `${start ?? ""}〜${end ?? ""}`;
}

/** 受付開始（開始の15分前。例: "13:30" → "13:15"）。開始時刻が無ければ null */
function receptionTime(start: string | null): string | null {
  const m = start?.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const t = Number(m[1]) * 60 + Number(m[2]) - 15;
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
}

/** 事前課題の締切＝Day1 の前日（例: "10月16日(金)"）。Day1 未定なら null */
function preDeadline(day1: Date | null | undefined): string | null {
  if (!day1) return null;
  const d = new Date(new Date(day1).getTime() - 24 * 60 * 60 * 1000);
  return d.toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

/** 研修（開催回）から、メールの日程・会場の表示に使う値を作る */
function sessionContext(session: ContextSession | null) {
  const address = !session?.isOnline ? session?.venueAddress?.trim() || null : null;
  return {
    sessionName: session?.name ?? null,
    day1Date: formatJpDate(session?.day1Date),
    day2Date: formatJpDate(session?.day2Date),
    timeRange: formatTimeRange(session?.startTime ?? null, session?.endTime ?? null),
    receptionTime: receptionTime(session?.startTime ?? null),
    preDeadline: preDeadline(session?.day1Date),
    location: session?.location ?? null,
    isOnline: session?.isOnline ?? false,
    venueAddress: address,
    // 地図の検索には「（田町駅 徒歩8分）」などの補足を含めない
    mapUrl: address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.replace(/[（(].*$/, "").trim())}`
      : null,
    expiresInDays: INVITE_TTL_DAYS,
  };
}

/** プレビュー用のダミー文脈（宛先を選ばずに文面だけ確認したいとき） */
export function sampleContext(
  template: TemplateKey,
  session: ContextSession | null
): TemplateContext {
  return {
    name: "山田 太郎",
    actionUrl:
      template === "invite" || template === "day1_info"
        ? cohortUrl(session?.code ?? "SAMPLE")
        : appUrl(ACTION_PATH[template]!),
    ...sessionContext(session),
  };
}
