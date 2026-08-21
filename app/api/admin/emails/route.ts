import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, resolveSession } from "@/lib/adminAuth";
import { emailConfigSummary, sendTemplateEmails } from "@/lib/email";
import { isTemplateKey, type TemplateContext } from "@/lib/emailTemplates";
import { buildContext } from "./_context";

/**
 * 送信履歴の取得（GET）と、テンプレートメールの一括送信（POST）。
 *
 * GET  … 講師も自分の担当セッションの履歴を見られる（requireAdmin）
 * POST … 送信は外向きの操作なので事務局のみ（requireAdmin）
 */

const MAX_RECIPIENTS = 200;

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  const workshopSession = await resolveSession(sessionId);
  if (!workshopSession) {
    return NextResponse.json({ config: await emailConfigSummary(), logs: [] });
  }

  const logs = await prisma.emailLog.findMany({
    where: { sessionId: workshopSession.id },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      to: true,
      template: true,
      subject: true,
      status: true,
      error: true,
      sentBy: true,
      createdAt: true,
      user: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({
    config: await emailConfigSummary(),
    logs: logs.map((l) => ({
      id: l.id,
      to: l.to,
      name: l.user?.name ?? null,
      userId: l.user?.id ?? null,
      template: l.template,
      subject: l.subject,
      status: l.status,
      error: l.error,
      sentBy: l.sentBy,
      createdAt: l.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => ({}));
  const template = body.template;
  const sessionId = str(body.sessionId);
  const userIds: string[] = Array.isArray(body.userIds)
    ? body.userIds.filter((v: unknown): v is string => typeof v === "string")
    : [];

  if (!isTemplateKey(template)) {
    return NextResponse.json({ error: "テンプレートを選択してください。" }, { status: 400 });
  }
  if (userIds.length === 0) {
    return NextResponse.json({ error: "宛先を1名以上選択してください。" }, { status: 400 });
  }
  if (userIds.length > MAX_RECIPIENTS) {
    return NextResponse.json(
      { error: `一度に送信できるのは${MAX_RECIPIENTS}名までです。` },
      { status: 400 }
    );
  }

  const workshopSession = await resolveSession(sessionId);
  if (!workshopSession) {
    return NextResponse.json({ error: "セッションが見つかりません。" }, { status: 404 });
  }

  // 宛先は「そのセッションの受講生」に限定する。
  // 画面から来たIDをそのまま信じると、他セッションの人にも送れてしまう。
  const users = await prisma.user.findMany({
    where: {
      id: { in: userIds },
      workshopData: { sessionId: workshopSession.id },
    },
    select: {
      id: true,
      email: true,
      name: true,
      inviteToken: true,
      activatedAt: true,
    },
  });

  const sendable: {
    userId: string;
    email: string;
    name: string | null;
    context: TemplateContext;
  }[] = [];
  const skipped: { email: string; name: string | null; reason: string }[] = [];

  for (const user of users) {
    const result = buildContext(template, user, workshopSession);
    if (!result.ok) {
      skipped.push({ email: user.email, name: user.name, reason: result.reason });
      continue;
    }
    sendable.push({
      userId: user.id,
      email: user.email,
      name: user.name,
      context: result.context,
    });
  }

  const sendResults =
    sendable.length > 0
      ? await sendTemplateEmails(
          sendable.map((row) => ({
            template,
            to: row.email,
            context: row.context,
            userId: row.userId,
            sessionId: workshopSession.id,
          })),
          guard.session.email ?? null
        )
      : [];

  const results = [
    ...sendable.map((row, i) => ({
      email: row.email,
      name: row.name,
      status: sendResults[i]?.ok ? ("sent" as const) : ("failed" as const),
      reason: sendResults[i]?.error,
    })),
    ...skipped.map((row) => ({
      email: row.email,
      name: row.name,
      status: "skipped" as const,
      reason: row.reason,
    })),
  ];

  return NextResponse.json({
    summary: {
      requested: userIds.length,
      sent: results.filter((r) => r.status === "sent").length,
      failed: results.filter((r) => r.status === "failed").length,
      skipped: results.filter((r) => r.status === "skipped").length,
    },
    results,
  });
}
