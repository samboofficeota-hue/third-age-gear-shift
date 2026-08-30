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

/**
 * いま本当に admin かを **DBを正として** 判定する。
 *
 * `session.role` は Supabase の app_metadata にキャッシュされた値で、本人が再ログインするまで
 * 更新されない。離任などで DB の role を落としても、既存セッションは admin のまま通ってしまう。
 * 権限を戻すタイミングを当人が握ってしまうため、管理系は毎回 DB を引き直す
 * （呼び出し頻度が低く、1クエリのコストは問題にならない）。
 *
 * middleware は Edge 実行で Prisma を呼べないため、ここが実質の最終防衛線になる。
 */
export async function isAdminInDb(userId: string): Promise<boolean> {
  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return current?.role === "admin";
}

export async function requireAdmin(): Promise<Guard> {
  const session = await getSession();
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: "ログインしてください。" }, { status: 401 }),
    };
  }

  if (!(await isAdminInDb(session.sub))) {
    return {
      ok: false,
      response: NextResponse.json({ error: "権限がありません。" }, { status: 403 }),
    };
  }

  return { ok: true, session: { ...session, role: "admin" } };
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
