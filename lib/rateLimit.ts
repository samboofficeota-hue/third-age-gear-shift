/**
 * ログイン試行のレート制限（インメモリ）。
 *
 * 仕組み:
 * - email 単位 / IP 単位の 2 軸で 15 分のスライディング窓を管理。
 * - 失敗が email で 5 回に達したら 15 分ロック。
 * - 失敗が IP で 20 回に達したら 15 分ロック。
 * - 認証成功で email 側のカウンタはリセット。
 *
 * 注意:
 * - Vercel サーバーレスではインスタンスごとに独立。完全な防御ではないが、
 *   単純ブルートフォース・辞書攻撃に対する一次防壁として有効。
 * - より厳密にしたい場合は Upstash Redis / Supabase の専用テーブルに移行する。
 */

type Counter = { count: number; firstAt: number; lockedUntil?: number };

const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;
const MAX_EMAIL_FAILS = 5;
const MAX_IP_FAILS = 20;
const MAX_MAP_SIZE = 10_000; // メモリ上限の保険

const byEmail = new Map<string, Counter>();
const byIp = new Map<string, Counter>();

function pruneIfHuge(map: Map<string, Counter>) {
  if (map.size <= MAX_MAP_SIZE) return;
  const now = Date.now();
  const entries = Array.from(map.entries());
  for (let idx = 0; idx < entries.length; idx++) {
    const [key, c] = entries[idx];
    const expired = now - c.firstAt > WINDOW_MS && !(c.lockedUntil && c.lockedUntil > now);
    if (expired) map.delete(key);
    if (map.size <= MAX_MAP_SIZE / 2) break;
  }
}

function readWindow(map: Map<string, Counter>, key: string): Counter {
  const now = Date.now();
  const existing = map.get(key);
  if (!existing) {
    const fresh: Counter = { count: 0, firstAt: now };
    map.set(key, fresh);
    pruneIfHuge(map);
    return fresh;
  }
  const locked = existing.lockedUntil && existing.lockedUntil > now;
  if (!locked && now - existing.firstAt > WINDOW_MS) {
    existing.count = 0;
    existing.firstAt = now;
    existing.lockedUntil = undefined;
  }
  return existing;
}

export type RateLimitVerdict =
  | { ok: true }
  | { ok: false; retryAfterSec: number; reason: "email" | "ip" };

export function checkLoginAttempt(email: string, ip: string): RateLimitVerdict {
  const now = Date.now();
  const e = readWindow(byEmail, email.toLowerCase());
  if (e.lockedUntil && e.lockedUntil > now) {
    return { ok: false, retryAfterSec: Math.ceil((e.lockedUntil - now) / 1000), reason: "email" };
  }
  const i = readWindow(byIp, ip);
  if (i.lockedUntil && i.lockedUntil > now) {
    return { ok: false, retryAfterSec: Math.ceil((i.lockedUntil - now) / 1000), reason: "ip" };
  }
  return { ok: true };
}

export function recordLoginFailure(email: string, ip: string): void {
  const now = Date.now();
  const e = readWindow(byEmail, email.toLowerCase());
  e.count += 1;
  if (e.count >= MAX_EMAIL_FAILS) e.lockedUntil = now + LOCK_MS;

  const i = readWindow(byIp, ip);
  i.count += 1;
  if (i.count >= MAX_IP_FAILS) i.lockedUntil = now + LOCK_MS;
}

export function recordLoginSuccess(email: string): void {
  byEmail.delete(email.toLowerCase());
}

/** "x-forwarded-for" から最前のクライアント IP を取り出す。なければ "unknown"。 */
export function clientIpFrom(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip") ?? "unknown";
}
