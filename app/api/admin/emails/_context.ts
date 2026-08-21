import { buildInviteUrl, INVITE_TTL_DAYS } from "@/lib/invite";
import type { TemplateContext, TemplateKey } from "@/lib/emailTemplates";

/**
 * 宛先ユーザー＋セッションから、テンプレートに渡す TemplateContext を組み立てる。
 * 「このテンプレートはこのリンクに飛ばす」という対応をここ1箇所に閉じ込める。
 */

/** テンプレートごとの遷移先。invite だけは宛先ごとのトークンURLなので null。 */
const ACTION_PATH: Record<TemplateKey, string | null> = {
  invite: null, // buildInviteUrl(token)
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
    if (!user.inviteToken) {
      return { ok: false, reason: "招待トークンがありません（招待タブで発行してください）" };
    }
    actionUrl = buildInviteUrl(user.inviteToken);
  } else {
    // 招待以外は本人がログインして開く画面。未有効化の人には届いても入れない
    if (!user.activatedAt) {
      return { ok: false, reason: "まだアカウントが有効化されていません" };
    }
    actionUrl = appUrl(ACTION_PATH[template]!);
  }

  return {
    ok: true,
    context: {
      name: user.name?.trim() || "ご参加者",
      actionUrl,
      sessionName: session?.name ?? null,
      day1Date: formatJpDate(session?.day1Date),
      day2Date: formatJpDate(session?.day2Date),
      location: session?.location ?? null,
      isOnline: session?.isOnline ?? false,
      expiresInDays: INVITE_TTL_DAYS,
    },
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
        ? appUrl("/welcome?token=SAMPLE-TOKEN")
        : appUrl(ACTION_PATH[template]!),
    sessionName: session?.name ?? null,
    day1Date: formatJpDate(session?.day1Date),
    day2Date: formatJpDate(session?.day2Date),
    location: session?.location ?? null,
    isOnline: session?.isOnline ?? false,
    expiresInDays: INVITE_TTL_DAYS,
  };
}
