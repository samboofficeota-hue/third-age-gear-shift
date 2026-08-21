import { BRAND } from "@/lib/brand";

/**
 * 送信メールの本文テンプレート（M-1）。
 *
 * 設計方針
 * - 文面はここに集約する。API・UI側で本文を組み立てない（文言の単一の出所）。
 * - **見た目は COMMUNITY のハウススタイルに揃える**。同じ Resend アカウント
 *   （noreply@communitysociety.co.jp）から届くメールなので、サードエイジ・プロジェクト
 *   （third-age-project の api/_registrationEmail.ts / survey-result-email.ts）と
 *   同じ骨格＝ヘッダー帯 + 枠付き本文 + ピル型CTA + プライバシー注記 を使う。
 * - 参加者画面のネオン×ダークはメールでは再現しない（メーラーが背景色を落とすため）。
 * - HTML はインラインstyleのみ。<style>・flex・gap はメーラーで落ちる。
 * - すべてのテンプレートは同じ TemplateContext から描画する。
 */

export const EMAIL_TEMPLATE_KEYS = [
  "invite",
  "reminder_pre",
  "completion",
  "followup_3m",
] as const;

export type TemplateKey = (typeof EMAIL_TEMPLATE_KEYS)[number];

export type TemplateContext = {
  /** 宛名。氏名が無い場合は呼び出し側で「ご参加者」を入れる */
  name: string;
  /** 本文のボタンが指すURL（招待URL / ログインURL / アンケートURL） */
  actionUrl: string;
  sessionName: string | null;
  /** 表示用に整形済みの日付文字列（例: "2026年9月3日(水)"）。未定は null */
  day1Date: string | null;
  day2Date: string | null;
  location: string | null;
  isOnline: boolean;
  /** 招待リンクの有効日数 */
  expiresInDays: number;
};

export type RenderedEmail = {
  subject: string;
  html: string;
  text: string;
};

/** 管理画面のテンプレート選択に出すメタ情報 */
export type TemplateMeta = {
  key: TemplateKey;
  label: string;
  /** 何のために送るメールか（管理画面の説明文） */
  purpose: string;
  /** actionUrl に入れるべきリンクの種類（管理画面の表示用） */
  linkLabel: string;
  /** ワークフロー上の想定タイミング（ADMIN_WORKFLOW.md の記号） */
  timing: string;
};

export const TEMPLATE_META: Record<TemplateKey, TemplateMeta> = {
  invite: {
    key: "invite",
    label: "招待メール",
    purpose: "アカウントを有効化して事前課題に入ってもらう",
    linkLabel: "招待URL（/welcome?token=…）",
    timing: "P-1 / Day1の2週間前",
  },
  reminder_pre: {
    key: "reminder_pre",
    label: "事前課題リマインド",
    purpose: "未提出の方に事前アンケート・じぶん紹介を促す",
    linkLabel: "ログインURL（/login）",
    timing: "P-6 / Day1の1週間前・3日前",
  },
  completion: {
    key: "completion",
    label: "修了の激励",
    purpose: "Day2を終えた方に、書いた内容を持ち帰ってもらう",
    linkLabel: "ダッシュボードURL（/workshop）",
    timing: "A-2 / Day2当日〜翌日",
  },
  followup_3m: {
    key: "followup_3m",
    label: "3ヶ月後リマインド",
    purpose: "3ヶ月後の変化をふりかえり、§Fアンケートに答えてもらう",
    linkLabel: "近況アンケートURL（/workshop/followup）",
    timing: "F-1 / Day2の90日後",
  },
};

/* ── COMMUNITY ハウスパレット ──────────────────────────
   third-age-project のメールと同じ値を使う。ここを勝手に変えると
   同じ差出人から届くメールなのに別ブランドに見えるので触らない。 */
const INK = "#2b3330"; // 本文
const MUTED = "#5b6661"; // 補足
const FINE = "#9aa3a0"; // 注記（最小）
const LINE = "#e5e5e5"; // 罫線
const ACCENT = "#0a5f54"; // 見出し・CTA（COMMUNITY ディープティール）
const TINT = "#eef7f4"; // callout の薄面
const TABLE_LABEL = "#f5f5f0"; // 情報テーブルのラベル列
const PRIVACY_URL = "https://communitysociety.co.jp/privacy/";
const FONT = "'Hiragino Kaku Gothic ProN','Noto Sans JP',sans-serif";

export function escapeHtml(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 開催日程の情報テーブル。未定の項目は行ごと出さない（「未定」を並べない）。 */
function scheduleTable(ctx: TemplateContext): string {
  const rows: [string, string][] = [];
  if (ctx.sessionName) rows.push(["研修", ctx.sessionName]);
  if (ctx.day1Date) rows.push(["Day1", ctx.day1Date]);
  if (ctx.day2Date) rows.push(["Day2", ctx.day2Date]);
  if (ctx.location) rows.push([ctx.isOnline ? "オンライン" : "会場", ctx.location]);
  if (rows.length === 0) return "";

  const body = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:10px 14px;background:${TABLE_LABEL};font-weight:bold;width:110px;border:1px solid #ddd;font-size:14px;">${escapeHtml(label)}</td>
          <td style="padding:10px 14px;border:1px solid #ddd;font-size:14px;">${escapeHtml(value)}</td>
        </tr>`
    )
    .join("");

  return `<table style="width:100%;border-collapse:collapse;margin:0 0 20px;">${body}</table>`;
}

function scheduleText(ctx: TemplateContext): string {
  const lines: string[] = [];
  if (ctx.sessionName) lines.push(`研修：${ctx.sessionName}`);
  if (ctx.day1Date) lines.push(`Day1：${ctx.day1Date}`);
  if (ctx.day2Date) lines.push(`Day2：${ctx.day2Date}`);
  if (ctx.location) lines.push(`${ctx.isOnline ? "オンライン" : "会場"}：${ctx.location}`);
  return lines.length ? lines.join("\n") + "\n\n" : "";
}

/** 全メール共通の外枠。ヘッダー帯 → 枠付き本文 → ピル型CTA → 注記。 */
function layout(opts: {
  /** ヘッダー帯の英字ラベル（例: "INVITATION"） */
  eyebrow: string;
  title: string;
  bodyHtml: string;
  buttonLabel: string;
  buttonUrl: string;
  /** ボタン下の注記（有効期限など） */
  note?: string;
}): string {
  const url = escapeHtml(opts.buttonUrl);
  return `
  <div style="font-family:${FONT};max-width:600px;margin:0 auto;color:${INK};line-height:1.8;">
    <div style="background:${ACCENT};color:#fff;padding:28px 24px;border-radius:14px 14px 0 0;">
      <p style="margin:0 0 6px;font-size:12px;letter-spacing:.15em;opacity:.85;">${escapeHtml(opts.eyebrow)}</p>
      <h1 style="margin:0;font-size:20px;">${escapeHtml(opts.title)}</h1>
      <p style="margin:8px 0 0;font-size:13px;opacity:.9;">${escapeHtml(BRAND.name)}</p>
    </div>
    <div style="border:1px solid ${LINE};border-top:none;border-radius:0 0 14px 14px;padding:24px;">
      ${opts.bodyHtml}
      <p style="margin:22px 0 0;">
        <a href="${url}" style="display:inline-block;background:${ACCENT};color:#fff;text-decoration:none;border-radius:999px;padding:12px 28px;font-weight:bold;font-size:14px;">${escapeHtml(opts.buttonLabel)}</a>
      </p>
      <p style="font-size:12px;color:${MUTED};margin:14px 0 0;line-height:1.7;">
        ${opts.note ? escapeHtml(opts.note) + "<br>" : ""}
        ボタンが開かない場合は、次のURLをブラウザに貼り付けてください。<br>
        <span style="word-break:break-all;">${url}</span>
      </p>
      <p style="font-size:12px;color:${MUTED};margin:20px 0 0;padding-top:16px;border-top:1px solid ${LINE};line-height:1.8;">
        ご不明な点は <a href="mailto:${escapeHtml(BRAND.contactEmail)}" style="color:${ACCENT};">${escapeHtml(BRAND.contactEmail)}</a> までお気軽にお問い合わせください。
      </p>
      <p style="font-size:11px;color:${FINE};margin:12px 0 0;">
        ※ このメールに心当たりがない場合は、お手数ですが上記アドレスまでお知らせください。<br>
        ※ メールアドレスの取扱いについては、プライバシーポリシー（${PRIVACY_URL}）をご確認ください。
      </p>
    </div>
  </div>`;
}

/** テキスト版の共通フッター */
function textFooter(actionUrl: string): string {
  return `\n${actionUrl}\n\n----\n${BRAND.name}\n${BRAND.tagline}\nお問い合わせ：${BRAND.contactEmail}\nプライバシーポリシー：${PRIVACY_URL}\n`;
}

function p(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;">${text}</p>`;
}

/** 補足の囲み（COMMUNITY ハウスの callout） */
function callout(text: string): string {
  return `<div style="background:${TINT};border-left:4px solid ${ACCENT};border-radius:0 8px 8px 0;padding:12px 16px;margin:0 0 16px;">
        <p style="margin:0;font-size:13px;color:${MUTED};">${text}</p>
      </div>`;
}

/* ── 各テンプレート ─────────────────────────────────── */

function invite(ctx: TemplateContext): RenderedEmail {
  const subject = `【${BRAND.name}】受講のご案内とアカウント登録のお願い`;
  const html = layout({
    eyebrow: "INVITATION",
    title: "受講のご案内",
    buttonLabel: "アカウントを登録する",
    buttonUrl: ctx.actionUrl,
    note: `この登録リンクの有効期限は、発行から${ctx.expiresInDays}日間です。`,
    bodyHtml:
      p(`${escapeHtml(ctx.name)} 様`) +
      p(
        `このたびは「${escapeHtml(BRAND.name)}」にご参加いただきありがとうございます。<br>${escapeHtml(BRAND.tagline)}——そのための2日間です。`
      ) +
      scheduleTable(ctx) +
      p(
        "研修当日までに、<strong>事前アンケート</strong>と<strong>じぶん紹介シート</strong>のご記入をお願いしています。下のボタンからアカウントを登録すると、そのまま事前課題に進めます。"
      ) +
      callout(
        "ご入力にはPC（またはタブレット）をおすすめします。スマートフォンでも回答できますが、じぶん紹介シートは画面が広いほうが書きやすくなっています。"
      ),
  });
  const text = `${ctx.name} 様

このたびは「${BRAND.name}」にご参加いただきありがとうございます。
${BRAND.tagline}——そのための2日間です。

${scheduleText(ctx)}研修当日までに、事前アンケートとじぶん紹介シートのご記入をお願いしています。
次のURLからアカウントを登録すると、そのまま事前課題に進めます。
（この登録リンクの有効期限は、発行から${ctx.expiresInDays}日間です）

ご入力にはPC（またはタブレット）をおすすめします。
${textFooter(ctx.actionUrl)}`;
  return { subject, html, text };
}

function reminderPre(ctx: TemplateContext): RenderedEmail {
  const subject = `【${BRAND.name}】事前課題のご提出をお願いします`;
  const html = layout({
    eyebrow: "REMINDER",
    title: "事前課題のご提出をお願いします",
    buttonLabel: "事前課題を開く",
    buttonUrl: ctx.actionUrl,
    bodyHtml:
      p(`${escapeHtml(ctx.name)} 様`) +
      p(
        "研修日が近づいてまいりました。事前アンケートとじぶん紹介シートが、まだご提出になっていないようです。"
      ) +
      scheduleTable(ctx) +
      p(
        "じぶん紹介シートは<strong>Day1の冒頭で発表していただく</strong>ものです。当日の時間を「書く時間」ではなく「話す時間」に使えるよう、前日までのご記入にご協力ください。"
      ) +
      callout("すでにご提出済みの場合は、行き違いですのでご容赦ください。"),
  });
  const text = `${ctx.name} 様

研修日が近づいてまいりました。
事前アンケートとじぶん紹介シートが、まだご提出になっていないようです。

${scheduleText(ctx)}じぶん紹介シートはDay1の冒頭で発表していただくものです。
当日の時間を「書く時間」ではなく「話す時間」に使えるよう、前日までのご記入にご協力ください。

すでにご提出済みの場合は、行き違いですのでご容赦ください。
${textFooter(ctx.actionUrl)}`;
  return { subject, html, text };
}

function completion(ctx: TemplateContext): RenderedEmail {
  const subject = `【${BRAND.name}】2日間おつかれさまでした`;
  const html = layout({
    eyebrow: "THANK YOU",
    title: "2日間、おつかれさまでした",
    buttonLabel: "書いたものを見返す",
    buttonUrl: ctx.actionUrl,
    bodyHtml:
      p(`${escapeHtml(ctx.name)} 様`) +
      p(
        "2日間の研修、おつかれさまでした。じぶんを分解し、分析し、みらいのシナリオを描くところまで走り切っていただきました。"
      ) +
      p(
        "研修中に書き込んだワークシートは、すべてダッシュボードに残っています。PDFとしてダウンロードもできますので、ご家族と話すとき、上司と面談するときの材料にお使いください。"
      ) +
      callout(
        "3ヶ月後に、あらためて「その後どうなったか」をおうかがいするメールをお送りします。書いたことがどれだけ動いたか、そのときに確かめましょう。"
      ),
  });
  const text = `${ctx.name} 様

2日間の研修、おつかれさまでした。
じぶんを分解し、分析し、みらいのシナリオを描くところまで走り切っていただきました。

研修中に書き込んだワークシートは、すべてダッシュボードに残っています。
PDFとしてダウンロードもできますので、ご家族と話すとき、上司と面談するときの材料にお使いください。

3ヶ月後に、あらためて「その後どうなったか」をおうかがいするメールをお送りします。
${textFooter(ctx.actionUrl)}`;
  return { subject, html, text };
}

function followup3m(ctx: TemplateContext): RenderedEmail {
  const subject = `【${BRAND.name}】あれから3ヶ月、いかがお過ごしですか`;
  const html = layout({
    eyebrow: "3 MONTHS LATER",
    title: "あれから3ヶ月、いかがお過ごしですか",
    buttonLabel: "3ヶ月後のふりかえりに答える",
    buttonUrl: ctx.actionUrl,
    bodyHtml:
      p(`${escapeHtml(ctx.name)} 様`) +
      p(
        "研修から3ヶ月が経ちました。あのとき書いた「みらいのシナリオ」は、その後どうなっているでしょうか。"
      ) +
      p(
        "動き出したこと、動かせなかったこと、考えが変わったこと——どれも大切な結果です。5分ほどのアンケートで、いまの状態を聞かせてください。"
      ) +
      callout(
        "回答は次回以降の研修の改善に使わせていただきます。ご自身のダッシュボードからは、当時書いたワークシートをいつでも見返せます。"
      ),
  });
  const text = `${ctx.name} 様

研修から3ヶ月が経ちました。
あのとき書いた「みらいのシナリオ」は、その後どうなっているでしょうか。

動き出したこと、動かせなかったこと、考えが変わったこと——どれも大切な結果です。
5分ほどのアンケートで、いまの状態を聞かせてください。

回答は次回以降の研修の改善に使わせていただきます。
${textFooter(ctx.actionUrl)}`;
  return { subject, html, text };
}

const RENDERERS: Record<TemplateKey, (ctx: TemplateContext) => RenderedEmail> = {
  invite,
  reminder_pre: reminderPre,
  completion,
  followup_3m: followup3m,
};

export function isTemplateKey(v: unknown): v is TemplateKey {
  return typeof v === "string" && (EMAIL_TEMPLATE_KEYS as readonly string[]).includes(v);
}

export function renderTemplate(key: TemplateKey, ctx: TemplateContext): RenderedEmail {
  return RENDERERS[key](ctx);
}
