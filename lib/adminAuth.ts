import { NextResponse } from "next/server";
import { getSession, type SessionPayload } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * 管理系API（/api/admin/*）の共通ガード。
 *
 * 権限は2層のみ。運営（事務局・講師）は admin、受講する人が participant。
 * admin は全研修を横断して扱える（担当による絞り込みは行わない）。
 *
 * 使い方:
 *   const guard = await requireAdmin();
 *   if (!guard.ok) return guard.response;
 */
type Guard =
  | { ok: true; session: SessionPayload }
  | { ok: false; response: NextResponse };

export async function requireAdmin(): Promise<Guard> {
  const session = await getSession();
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: "ログインしてください。" }, { status: 401 }),
    };
  }
  if (session.role !== "admin") {
    return {
      ok: false,
      response: NextResponse.json({ error: "権限がありません。" }, { status: 403 }),
    };
  }
  return { ok: true, session };
}

/**
 * sessionId から研修を取得する。指定が無ければ最新の1件。
 * 2層モデルでは admin が全研修を扱えるため、絞り込み条件は無い。
 */
export async function resolveSession(sessionId: string | null | undefined) {
  if (sessionId) {
    return prisma.workshopSession.findUnique({ where: { id: sessionId } });
  }
  return prisma.workshopSession.findFirst({ orderBy: { createdAt: "desc" } });
}
