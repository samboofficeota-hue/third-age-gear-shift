/**
 * レポートのAI分析文を生成する（サーバー専用）。
 *
 * 生成は初回だけ。以後は WorkshopData.post.report に保存したものを表示する
 * （毎回生成すると同じ人に毎回違う文章が出てしまう。docs/REPORT_DESIGN.md §5）。
 */

import Anthropic from "@anthropic-ai/sdk";
import { buildReportSource, type ReportAxis, type ReportInput } from "./source";
import {
  buildPolicySystemPrompt,
  buildReportSystemPrompt,
  buildReportUserMessage,
} from "./prompt";

/**
 * レポートは受講者ひとりにつき一度きりの生成。
 * 文字数・語り口・「空欄に言及しない」といった細かい指示を守り切る必要があるため、
 * 対話系（Haiku 4.5）より指示追従の強いモデルを使う。
 * 呼び出し回数が少なくコストへの影響も小さい。
 */
const MODEL = "claude-sonnet-5";
/** 思考トークンも max_tokens に含まれるため、出力200字でも余裕を持たせる */
const MAX_TOKENS = 8000;

/** じぶん経営方針（MVV） */
export type ReportPolicy = {
  mission: string;
  vision: string;
  values: string[];
};

export type ReportTexts = {
  policy: ReportPolicy | null;
  company: string | null;
  society: string | null;
  generatedAt: string;
};

function readPolicy(v: unknown): ReportPolicy | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const mission = typeof o.mission === "string" ? o.mission : "";
  const vision = typeof o.vision === "string" ? o.vision : "";
  const values = Array.isArray(o.values)
    ? o.values.filter((x): x is string => typeof x === "string" && x.trim() !== "")
    : [];
  if (!mission && !vision && values.length === 0) return null;
  return { mission, vision, values };
}

/** post.report に保存済みのレポートを取り出す（形が違えば null） */
export function readSavedReport(post: unknown): ReportTexts | null {
  if (!post || typeof post !== "object") return null;
  const r = (post as Record<string, unknown>).report;
  if (!r || typeof r !== "object") return null;
  const o = r as Record<string, unknown>;
  if (typeof o.generatedAt !== "string") return null;
  return {
    policy: readPolicy(o.policy),
    company: typeof o.company === "string" ? o.company : null,
    society: typeof o.society === "string" ? o.society : null,
    generatedAt: o.generatedAt,
  };
}

async function generateOne(
  client: Anthropic,
  input: ReportInput,
  axis: Exclude<ReportAxis, "policy">
): Promise<string | null> {
  const source = buildReportSource(input, axis);
  // 材料が薄いときは生成しない（空レポートを保存して固定してしまわないため）
  if (!source) return null;

  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: buildReportSystemPrompt(axis),
      messages: [{ role: "user", content: buildReportUserMessage(source) }],
    });
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    return text === "" ? null : clampSentences(text, BODY_MAX);
  } catch (error) {
    console.error(`report: Anthropic request failed (${axis})`, error);
    return null;
  }
}

/** 前置きやコードブロックが付いてきても拾えるように、最初の { …… } を取り出す */
function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

/** 字数超過はカードからあふれるため、保存前に最終ガードをかける */
function clamp(s: string, max: number): string {
  const t = s.trim();
  return t.length <= max ? t : t.slice(0, max);
}

/**
 * 本文の最終ガード。カードは高さ固定のため、あふれると下が切れて読めなくなる。
 * 途中で切ると文章として壊れるので、上限を超えた分は**文の単位で**落とす。
 */
const BODY_MAX = 260;

function clampSentences(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  // 「。」で区切り、収まるところまで積み直す
  const sentences = t.split(/(?<=。)/);
  let out = "";
  for (const sentence of sentences) {
    if ((out + sentence).length > max) break;
    out += sentence;
  }
  // 1文目から上限を超える場合だけ、やむを得ず切って句点を補う
  return out || `${t.slice(0, max - 1)}。`;
}

async function generatePolicy(
  client: Anthropic,
  input: ReportInput
): Promise<ReportPolicy | null> {
  const source = buildReportSource(input, "policy");
  if (!source) return null;

  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: buildPolicySystemPrompt(),
      messages: [{ role: "user", content: buildReportUserMessage(source) }],
    });
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    const parsed = readPolicy(extractJson(text));
    if (!parsed) return null;
    return {
      mission: clamp(parsed.mission, 30),
      vision: clamp(parsed.vision, 30),
      values: parsed.values.slice(0, 3).map((v) => clamp(v, 20)),
    };
  } catch (error) {
    console.error("report: Anthropic request failed (policy)", error);
    return null;
  }
}

/**
 * じぶん経営方針（MVV）・会社軸・社会軸のレポートを生成する。
 * APIキー未設定・すべて材料不足のときは null（保存しない）。
 */
export async function generateReport(input: ReportInput): Promise<ReportTexts | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return null;

  const client = new Anthropic({ apiKey });
  const [policy, company, society] = await Promise.all([
    generatePolicy(client, input),
    generateOne(client, input, "company"),
    generateOne(client, input, "society"),
  ]);

  if (policy === null && company === null && society === null) return null;
  return { policy, company, society, generatedAt: new Date().toISOString() };
}
