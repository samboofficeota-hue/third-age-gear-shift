import { Resend } from "resend";
import { prisma } from "@/lib/db";
import { BRAND } from "@/lib/brand";
import {
  renderTemplate,
  type RenderedEmail,
  type TemplateContext,
  type TemplateKey,
} from "@/lib/emailTemplates";

/**
 * メール送信の単一の出口（M-1）。Resend を直接呼ぶのはこのファイルだけ。
 *
 * 設定は **third-age-project と同じ環境変数名に揃えている**。
 * 同じ Resend アカウント・同じ認証済みドメイン（communitysociety.co.jp）を使うので、
 * 両プロジェクトで同じ値をそのままコピーできる状態を保つこと。
 *   RESEND_API_KEY … Resend の APIキー
 *   FROM_EMAIL     … 差出人（例: "株式会社COMMUNITY <noreply@communitysociety.co.jp>"）
 *
 * 送信結果は成功・失敗ともに EmailLog に残す（管理画面の「メール」タブで確認・再送する）。
 * 例外は投げない。1件の失敗で一括送信全体を止めない設計。
 */

const FROM_EMAIL =
  process.env.FROM_EMAIL || "株式会社COMMUNITY <noreply@communitysociety.co.jp>";

/** 返信は事務局の問い合わせ窓口へ（noreply に返信させない） */
const REPLY_TO = BRAND.contactEmail;

let client: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

/** APIキーが設定されているか（管理画面に「送信できる状態か」を出すため） */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/**
 * 管理画面に出す送信設定の要約。APIキーそのものは絶対に返さない。
 *
 * appUrl も返すのは、メール内のリンクが localhost のまま本番送信される事故を
 * 画面側で警告するため（招待リンクが localhost だと受講生は永久に登録できない）。
 */
export function emailConfigSummary(): {
  configured: boolean;
  from: string;
  replyTo: string;
  appUrl: string;
} {
  return {
    configured: isEmailConfigured(),
    from: FROM_EMAIL,
    replyTo: REPLY_TO,
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "",
  };
}

export type SendResult =
  | { ok: true; providerId: string | null }
  | { ok: false; error: string };

/** Resend に投げるだけの下位関数。履歴は残さない。 */
export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<SendResult> {
  const resend = getResend();
  if (!resend) {
    return { ok: false, error: "RESEND_API_KEY が設定されていません。" };
  }
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      replyTo: REPLY_TO,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });
    if (result.error) {
      return { ok: false, error: result.error.message ?? "Resend がエラーを返しました。" };
    }
    return { ok: true, providerId: result.data?.id ?? null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "送信中に不明なエラーが発生しました。";
    console.error("resend send:", e);
    return { ok: false, error: message };
  }
}

/**
 * テンプレートを描画して送信し、結果を EmailLog に残す。
 * 事務局の一括送信・将来の Cron 自動送信の双方からここを呼ぶ。
 */
export async function sendTemplateEmail(params: {
  template: TemplateKey;
  to: string;
  context: TemplateContext;
  userId?: string | null;
  sessionId?: string | null;
  /** 送信操作をした事務局のメール。自動送信は null */
  sentBy?: string | null;
}): Promise<{ ok: boolean; subject: string; error?: string }> {
  const rendered: RenderedEmail = renderTemplate(params.template, params.context);
  const result = await sendEmail({
    to: params.to,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
  });

  // 履歴の書き込み失敗で送信自体を失敗扱いにしない（メールはもう出ている）
  try {
    await prisma.emailLog.create({
      data: {
        to: params.to,
        template: params.template,
        subject: rendered.subject,
        status: result.ok ? "sent" : "failed",
        providerId: result.ok ? result.providerId : null,
        error: result.ok ? null : result.error.slice(0, 500),
        userId: params.userId ?? null,
        sessionId: params.sessionId ?? null,
        sentBy: params.sentBy ?? null,
      },
    });
  } catch (e) {
    console.error("emailLog create:", e);
  }

  return result.ok
    ? { ok: true, subject: rendered.subject }
    : { ok: false, subject: rendered.subject, error: result.error };
}

/**
 * 複数宛先の一括送信。Resend の Batch API（1リクエスト最大100通）を使う。
 * 1通ずつ送ると Resend のレート制限（既定 2req/秒）に当たり、
 * 数十名の一括送信がサーバーレスの実行時間内に終わらないため。
 *
 * 返り値は入力と同じ順序。1件ごとに EmailLog を残す。
 */
export async function sendTemplateEmails(
  items: {
    template: TemplateKey;
    to: string;
    context: TemplateContext;
    userId?: string | null;
    sessionId?: string | null;
  }[],
  sentBy?: string | null
): Promise<{ to: string; ok: boolean; subject: string; error?: string }[]> {
  const resend = getResend();
  const rendered = items.map((item) => renderTemplate(item.template, item.context));

  if (!resend) {
    const error = "RESEND_API_KEY が設定されていません。";
    await writeLogs(items, rendered, items.map(() => ({ ok: false as const, error })), sentBy);
    return items.map((item, i) => ({
      to: item.to,
      ok: false,
      subject: rendered[i].subject,
      error,
    }));
  }

  const outcomes: ({ ok: true; providerId: string | null } | { ok: false; error: string })[] =
    new Array(items.length);

  const CHUNK = 100; // Resend Batch API の上限
  for (let start = 0; start < items.length; start += CHUNK) {
    const end = Math.min(start + CHUNK, items.length);
    const payload = [];
    for (let i = start; i < end; i++) {
      payload.push({
        from: FROM_EMAIL,
        to: items[i].to,
        replyTo: REPLY_TO,
        subject: rendered[i].subject,
        html: rendered[i].html,
        text: rendered[i].text,
      });
    }

    try {
      const result = await resend.batch.send(payload);
      if (result.error) {
        const error = result.error.message ?? "Resend がエラーを返しました。";
        for (let i = start; i < end; i++) outcomes[i] = { ok: false, error };
        continue;
      }
      const ids = result.data?.data ?? [];
      for (let i = start; i < end; i++) {
        outcomes[i] = { ok: true, providerId: ids[i - start]?.id ?? null };
      }
    } catch (e) {
      const error = e instanceof Error ? e.message : "送信中に不明なエラーが発生しました。";
      console.error("resend batch send:", e);
      for (let i = start; i < end; i++) outcomes[i] = { ok: false, error };
    }
  }

  await writeLogs(items, rendered, outcomes, sentBy);

  return items.map((item, i) => {
    const outcome = outcomes[i];
    return outcome.ok
      ? { to: item.to, ok: true, subject: rendered[i].subject }
      : { to: item.to, ok: false, subject: rendered[i].subject, error: outcome.error };
  });
}

/** 送信履歴をまとめて保存。ここで失敗しても送信結果は返す（メールはもう出ている）。 */
async function writeLogs(
  items: {
    template: TemplateKey;
    to: string;
    userId?: string | null;
    sessionId?: string | null;
  }[],
  rendered: RenderedEmail[],
  outcomes: ({ ok: true; providerId: string | null } | { ok: false; error: string })[],
  sentBy?: string | null
): Promise<void> {
  try {
    await prisma.emailLog.createMany({
      data: items.map((item, i) => {
        const outcome = outcomes[i];
        return {
          to: item.to,
          template: item.template,
          subject: rendered[i].subject,
          status: outcome.ok ? ("sent" as const) : ("failed" as const),
          providerId: outcome.ok ? outcome.providerId : null,
          error: outcome.ok ? null : outcome.error.slice(0, 500),
          userId: item.userId ?? null,
          sessionId: item.sessionId ?? null,
          sentBy: sentBy ?? null,
        };
      }),
    });
  } catch (e) {
    console.error("emailLog createMany:", e);
  }
}
