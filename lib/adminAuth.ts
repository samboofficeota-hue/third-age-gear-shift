import { NextResponse } from "next/server";
import { getSession, type SessionPayload } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * 管理系API（/api/admin/*）の共通ガード。
 *
 * admin  = 全研修を横断（事務局）
 * facilitator = 担当する WorkshopSession のみ（WorkshopSession.facilitatorId）
 *
 * 使い方:
 *   const guard = await requireStaff();
 *   if (!guard.ok) return guard.response;
 *   const { session } = guard;
 */
type Guard =
  | { ok: true; session: SessionPayload }
  | { ok: false; response: NextResponse };

export async function requireStaff(): Promise<Guard> {
  const session = await getSession();
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: "ログインしてください。" }, { status: 401 }),
    };
  }
  if (session.role !== "admin" && session.role !== "facilitator") {
    return {
      ok: false,
      response: NextResponse.json({ error: "権限がありません。" }, { status: 403 }),
    };
  }
  return { ok: true, session };
}

/** 事務局（admin）専用の操作。講師は不可。 */
export async function requireAdmin(): Promise<Guard> {
  const guard = await requireStaff();
  if (!guard.ok) return guard;
  if (guard.session.role !== "admin") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "この操作は事務局アカウントのみ実行できます。" },
        { status: 403 }
      ),
    };
  }
  return guard;
}

/**
 * 講師が触れるセッションを自分の担当分に限定するための where 条件。
 * admin は無条件（{}）。
 */
export function sessionScopeFor(session: SessionPayload) {
  return session.role === "facilitator" ? { facilitatorId: session.sub } : {};
}

/**
 * sessionId が「そのユーザーが扱ってよいセッションか」を検証して返す。
 * 講師が担当外のIDを直接投げてきた場合は null（呼び出し側で404/403にする）。
 */
export async function resolveSession(
  session: SessionPayload,
  sessionId: string | null | undefined
) {
  const scope = sessionScopeFor(session);
  if (sessionId) {
    return prisma.workshopSession.findFirst({
      where: { id: sessionId, ...scope },
    });
  }
  return prisma.workshopSession.findFirst({
    where: scope,
    orderBy: { createdAt: "desc" },
  });
}
