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

const DEFAULT_ADDRESS = "noreply@communitysociety.co.jp";

/** 差出人アドレスだけの値かどうか（表示名が付いていない） */
const ADDRESS_ONLY = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

/**
 * 差出人の表記ゆれを吸収する。
 *
 * .env ファイルなら dotenv が引用符を剥がすが、Vercel の環境変数UIは
 * 貼り付けた引用符をそのまま値に含める。その状態で送ると Resend に
 * 「Invalid `from` field」で拒否される（2026-08-21 に本番で発生）。
 * 全角の山括弧（＜＞）も同じ理由で直す。
 */
function normalizeFrom(raw: string): string {
  let v = raw.trim().replace(/＜/g, "<").replace(/＞/g, ">");
  const quoted =
    (v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"));
  if (quoted) v = v.slice(1, -1).trim();
  return v;
}

/** "a@b.jp" または "表示名 <a@b.jp>" だけを許す */
const FROM_PATTERN =
  /^(?:[^<>]+<\s*[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+\s*>|[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+)$/;

/**
 * 差出人を組み立てる。
 *
 * **FROM_EMAIL にはアドレスだけを入れ、表示名はアプリ側で付ける**——これが
 * 社内の他プロジェクトの作法（third-age-campus の fromAddress() を参照）。
 * ドメインは COMMUNITY 共通、表示名はサービスごとに変えたいため。
 * アドレスだけだと受信箱に「noreply@…」としか出ず、誰からのメールか分からない。
 *
 * 「表示名 <アドレス>」の形で入っていればそちらを尊重する（上書きしたい場合の逃げ道）。
 */
function buildFrom(): string {
  const raw = normalizeFrom(process.env.FROM_EMAIL ?? "");
  if (!raw) return `${BRAND.name} <${DEFAULT_ADDRESS}>`;
  if (ADDRESS_ONLY.test(raw)) return `${BRAND.name} <${raw}>`;
  return raw;
}

const FROM_EMAIL = buildFrom();

/** 差出人の形式が Resend に受け付けられる形か（送信前に画面で止めるため） */
export function isFromValid(): boolean {
  return FROM_PATTERN.test(FROM_EMAIL);
}

/**
 * 返信は事務局の問い合わせ窓口へ（noreply に返信させない）。
 * CONTACT_EMAIL は他プロジェクトと共通の変数名。未設定なら BRAND の値を使う。
 */
const REPLY_TO = normalizeFrom(process.env.CONTACT_EMAIL ?? "") || BRAND.contactEmail;

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

/** 差出人アドレスからドメイン部分を取り出す（"名前 <a@b.jp>" 形式にも対応） */
function fromDomain(): string {
  const match = FROM_EMAIL.match(/<([^>]+)>/);
  const address = (match ? match[1] : FROM_EMAIL).trim();
  return address.split("@")[1] ?? "";
}

/**
 * 差出人ドメインが Resend で認証済みかを実際に問い合わせる。
 *
 * 「APIキーが入っている」ことと「そのキーで送れる」ことは別物で、
 * 認証ドメインを持たない別アカウントのキーが入っていても設定画面は正常に見えてしまう。
 * （実際にそれで本番の初回送信が落ちた。2026-08-21）
 * 送信ボタンを押す前にここで気づけるようにする。
 *
 * 送信専用（sending only）のキーはドメイン一覧を読めないので、その場合は
 * 「確認できない」= unknown を返し、送信自体は止めない。
 */
type DomainCheck = { state: "verified" | "unverified" | "unknown"; domain: string };

let domainCache: { value: DomainCheck; expiresAt: number } | null = null;
const DOMAIN_CACHE_MS = 5 * 60 * 1000;

async function checkSendingDomain(): Promise<DomainCheck> {
  const domain = fromDomain();
  if (domainCache && domainCache.expiresAt > Date.now()) return domainCache.value;

  const resend = getResend();
  let value: DomainCheck = { state: "unknown", domain };
  if (resend && domain) {
    try {
      const result = await resend.domains.list();
      if (!result.error) {
        const list = result.data?.data ?? [];
        const hit = list.find((d) => d.name === domain);
        value = { state: hit?.status === "verified" ? "verified" : "unverified", domain };
      }
    } catch (e) {
      // 権限不足・ネットワーク断は「確認できない」として扱う（送信は妨げない）
      console.error("resend domains.list:", e);
    }
  }

  domainCache = { value, expiresAt: Date.now() + DOMAIN_CACHE_MS };
  return value;
}

export type EmailConfigSummary = {
  configured: boolean;
  from: string;
  /** 差出人の書式が正しいか（引用符ごと貼られていないか等） */
  fromValid: boolean;
  replyTo: string;
  appUrl: string;
  /** 差出人ドメインの認証状態。unknown は「確認できなかった」 */
  domainState: DomainCheck["state"];
  domain: string;
};

/**
 * 管理画面に出す送信設定の要約。APIキーそのものは絶対に返さない。
 *
 * appUrl を返すのは、メール内のリンクが localhost のまま本番送信される事故を
 * 画面側で警告するため（招待リンクが localhost だと受講生は永久に登録できない）。
 */
export async function emailConfigSummary(): Promise<EmailConfigSummary> {
  const check = await checkSendingDomain();
  return {
    configured: isEmailConfigured(),
    from: FROM_EMAIL,
    fromValid: isFromValid(),
    replyTo: REPLY_TO,
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "",
    domainState: check.state,
    domain: check.domain,
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
