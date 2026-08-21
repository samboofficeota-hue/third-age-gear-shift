import { NextResponse } from "next/server";
import { requireAdmin, resolveSession } from "@/lib/adminAuth";
import { sendTemplateEmail } from "@/lib/email";
import { isTemplateKey } from "@/lib/emailTemplates";
import { isValidEmail } from "@/lib/invite";
import { sampleContext } from "../_context";

/**
 * テスト送信。受講生に一斉送信する前に、事務局が自分宛などへ1通だけ送って
 * 実際の見え方（差出人表示・迷惑メール判定・リンク）を確かめるためのもの。
 *
 * 宛先は受講生でなくてよいので、本文はダミー宛名のサンプル文脈で描画する。
 * ただし日程・会場は選択中セッションの実データを使う（本番と同じ見え方になる）。
 * 履歴には userId=null で残るため、受講生への送信実績とは混ざらない。
 */
export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => ({}));
  const template = body.template;
  const sessionId = typeof body.sessionId === "string" ? body.sessionId : null;
  const to = typeof body.to === "string" ? body.to.trim().toLowerCase() : "";

  if (!isTemplateKey(template)) {
    return NextResponse.json({ error: "テンプレートを選択してください。" }, { status: 400 });
  }
  if (!isValidEmail(to)) {
    return NextResponse.json(
      { error: "送信先メールアドレスの形式が正しくありません。" },
      { status: 400 }
    );
  }

  const workshopSession = await resolveSession(guard.session, sessionId);

  const result = await sendTemplateEmail({
    template,
    to,
    context: sampleContext(template, workshopSession),
    userId: null,
    sessionId: workshopSession?.id ?? null,
    sentBy: guard.session.email ?? null,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "送信に失敗しました。" }, { status: 502 });
  }
  return NextResponse.json({ ok: true, to, subject: result.subject });
}
