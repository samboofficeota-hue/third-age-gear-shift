import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, resolveSession } from "@/lib/adminAuth";
import { emailConfigSummary } from "@/lib/email";
import { isTemplateKey, renderTemplate } from "@/lib/emailTemplates";
import { buildContext, sampleContext } from "../_context";

/**
 * 送信前プレビュー（P-1の「内容を確認してから送る」を担保する）。
 * userId を指定すると実際の宛先の文脈（氏名・招待URL・日程）で描画し、
 * 省略するとダミー宛先で文面だけを確認する。送信は行わない。
 */
export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => ({}));
  const template = body.template;
  const sessionId = typeof body.sessionId === "string" ? body.sessionId : null;
  const userId = typeof body.userId === "string" && body.userId ? body.userId : null;

  if (!isTemplateKey(template)) {
    return NextResponse.json({ error: "テンプレートを選択してください。" }, { status: 400 });
  }

  const workshopSession = await resolveSession(sessionId);

  if (!userId) {
    const rendered = renderTemplate(template, sampleContext(template, workshopSession));
    return NextResponse.json({ ...rendered, sample: true, config: await emailConfigSummary() });
  }

  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      ...(workshopSession ? { workshopData: { sessionId: workshopSession.id } } : {}),
    },
    select: { email: true, name: true, inviteToken: true, activatedAt: true },
  });
  if (!user) {
    return NextResponse.json({ error: "受講生が見つかりません。" }, { status: 404 });
  }

  const result = buildContext(template, user, workshopSession);
  if (!result.ok) {
    // 送れない相手でも文面は見せる（なぜ送れないかを添える）
    const rendered = renderTemplate(template, sampleContext(template, workshopSession));
    return NextResponse.json({
      ...rendered,
      sample: true,
      blockedReason: result.reason,
      config: await emailConfigSummary(),
    });
  }

  const rendered = renderTemplate(template, result.context);
  return NextResponse.json({
    ...rendered,
    sample: false,
    to: user.email,
    config: await emailConfigSummary(),
  });
}
