import { randomBytes } from "crypto";

/**
 * 招待リンクの有効期間。
 * 招待メールが転送・流出しても無期限に使われないよう、発行から一定日数で失効させる。
 * 期限切れは事務局が招待タブから再発行する（同じメールに再発行すると新しいトークンになる）。
 */
export const INVITE_TTL_DAYS = 14;

/** 招待トークン（/welcome?token=... で本人を特定する） */
export function generateInviteToken(): string {
  return randomBytes(24).toString("base64url");
}

/** 招待の期限切れ判定。invitedAt が無い古いデータは期限なしとして扱う。 */
export function isInviteExpired(invitedAt: Date | null | undefined): boolean {
  if (!invitedAt) return false;
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
