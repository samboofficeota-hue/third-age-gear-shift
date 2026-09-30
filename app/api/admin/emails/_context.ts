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

/** 研修（開催回）から、メールの日程・会場の表示に使う値を作る */
function sessionContext(session: ContextSession | null) {
  const address = !session?.isOnline ? session?.venueAddress?.trim() || null : null;
  return {
    sessionName: session?.name ?? null,
    day1Date: formatJpDate(session?.day1Date),
    day2Date: formatJpDate(session?.day2Date),
    timeRange: formatTimeRange(session?.startTime ?? null, session?.endTime ?? null),
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
      template === "invite"
        ? cohortUrl(session?.code ?? "SAMPLE")
        : appUrl(ACTION_PATH[template]!),
    ...sessionContext(session),
  };
}
