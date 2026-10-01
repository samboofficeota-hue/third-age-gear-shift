import { randomBytes } from "crypto";

/**
 * 招待リンクの有効期間。
 * 招待メールが転送・流出しても無期限に使われないよう、発行から一定日数で失効させる。
 * 期限は研修の Day2 の日まで（isInviteExpired）。Day2 が未定の研修だけ、発行からこの日数。
 * 期限切れは事務局が招待タブから再発行する（同じメールに再発行すると新しいトークンになる）。
 */
export const INVITE_TTL_DAYS = 30;

/** 招待トークン（/welcome?token=... で本人を特定する） */
export function generateInviteToken(): string {
  return randomBytes(24).toString("base64url");
}

/**
 * 招待の期限切れ判定。
 * 研修の Day2 の日（その日の終わりまで）を期限にする。Day2 が未定の研修は発行から INVITE_TTL_DAYS 日。
 * invitedAt が無い古いデータは期限なしとして扱う。
 */
export function isInviteExpired(
  invitedAt: Date | null | undefined,
  day2Date?: Date | null
): boolean {
  if (!invitedAt) return false;
  if (day2Date) {
    // Day2 の日（日本時間）の翌日 0:00 を過ぎたら期限切れ
    const JST_MS = 9 * 60 * 60 * 1000;
    const jst = new Date(new Date(day2Date).getTime() + JST_MS);
    const nextJstMidnight =
      Date.UTC(jst.getUTCFullYear(), jst.getUTCMonth(), jst.getUTCDate() + 1) - JST_MS;
    return Date.now() >= nextJstMidnight;
  }
  const ttlMs = INVITE_TTL_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() - new Date(invitedAt).getTime() > ttlMs;
}

/**
 * 招待URL。NEXT_PUBLIC_APP_URL が未設定の場合はパスのみを返し、
 * 事務局が手元でドメインを補えるようにする。
 */
export function buildInviteUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  return `${base}/welcome?token=${token}`;
}

export function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
