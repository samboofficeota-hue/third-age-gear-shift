// プチ越境体験インタビューの Anthropic 呼び出し。
// lib/ai.ts と同じ公式SDK・同じモデル選定を使う薄いラッパー。
// APIキー未設定・APIエラー・セーフティ拒否時は null を返し、呼び出し側で
// スクリプト応答（scripted.ts）にフォールバックする。

import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-haiku-4-5-20251001";

export type ChatTurn = { role: "user" | "assistant"; content: string };

export type CompleteOptions = {
  system: string;
  messages: ChatTurn[];
  maxTokens: number;
};

export function hasApiKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY?.trim();
}

export async function complete(opts: CompleteOptions): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const client = new Anthropic({ apiKey });
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: opts.maxTokens,
      system: opts.system,
      messages: opts.messages,
    });

    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    return text === "" ? null : text;
  } catch (error) {
    console.error("excursion interview: Anthropic API request failed", error);
    return null;
  }
}
