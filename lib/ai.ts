import Anthropic from "@anthropic-ai/sdk";
import { BRAND } from "@/lib/brand";

/**
 * AIナビゲーターのメッセージ生成を集約する。
 * 5つのAIタッチポイント（Day1/Day2コメント・宿題伴走・終了後メール・3ヶ月後）と
 * 共通の口調・安全制約をここで一元管理する。
 */

const MODEL = "claude-haiku-4-5-20251001";

type SlideForAI = {
  name?: string;
  nickname?: string;
  points?: string[];
  history?: { year?: string; event?: string }[];
  work?: { company?: string };
};

/** AI生成に失敗したときの固定メッセージ（ページが崩れないよう温かい文に） */
export const WELCOME_FALLBACK =
  "ご提出ありがとうございます！Day1でお会いできるのを、いまから楽しみにしています。";

const WELCOME_SYSTEM = `あなたは社会人向け研修「${BRAND.name}」のAIナビゲーターです。
受講生が事前課題（自己紹介）を提出した直後に表示する、短い歓迎メッセージを書きます。

口調・内容のルール:
- 日本語。やわらかく親しみやすいが、ビジネスパーソン相手として失礼にならないトーン。
- 必ず2行以内。全体で60文字以内に収め、簡潔にする。
- ニックネームがあればニックネーム、なければ名前で呼びかける。
- 自己紹介の具体的な要素（3つのポイント・経歴・会社など）に触れるのは1つだけ。複数を列挙しない。
- 渡された情報だけを使い、事実を創作しない。情報が少なければ無理に具体に触れず、温かく締める。
- 絵文字は最大1つまで。
- 「Day1で会えるのが楽しみ」というワクワク感で締める。
- 前置きや説明は不要。メッセージ本文だけを出力する。`;

function buildProfileText(slide: SlideForAI): string {
  const points = (slide.points ?? []).filter((p) => p?.trim());
  const history = (slide.history ?? []).filter((h) => h?.event?.trim());
  return [
    slide.nickname ? `ニックネーム: ${slide.nickname}` : "",
    slide.name ? `名前: ${slide.name}` : "",
    points.length ? `知ってほしい3つのポイント: ${points.join(" / ")}` : "",
    slide.work?.company ? `今の会社: ${slide.work.company}` : "",
    history.length
      ? `経歴: ${history
          .map((h) => `${h.year ?? ""} ${h.event}`.trim())
          .join(" / ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * 事前課題の提出を受けた歓迎メッセージを生成する。
 * 失敗時は例外を投げる（呼び出し側でフォールバックを使う）。
 */
export async function generateWelcomeMessage(slide: SlideForAI): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const client = new Anthropic({ apiKey });
  const profileText = buildProfileText(slide) || "（自己紹介の記入はまだ少なめです）";

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 200,
    system: WELCOME_SYSTEM,
    messages: [
      {
        role: "user",
        content: `次の受講生の自己紹介です:\n${profileText}\n\nこの方への歓迎メッセージを2行以内で書いてください。`,
      },
    ],
  });

  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  if (!text) throw new Error("empty AI response");
  return text;
}
