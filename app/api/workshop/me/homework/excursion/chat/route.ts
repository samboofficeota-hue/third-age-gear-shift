import { NextResponse } from "next/server";
import { canAccessPhase } from "@/lib/workshopAccess";
import { complete } from "@/lib/homework/excursion/anthropic.server";
import { nextState, stateFromMessages } from "@/lib/homework/excursion/ladder";
import { buildSystemPrompt, buildTurnInstruction } from "@/lib/homework/excursion/prompt";
import { parseQuickReplies } from "@/lib/homework/excursion/quickReplies";
import { scriptedTurn } from "@/lib/homework/excursion/scripted";
import type { ChatMessage, ChatResponse } from "@/lib/homework/excursion/types";

/**
 * POST /api/workshop/me/homework/excursion/chat
 * プチ越境体験「AIインタビュー」。対話履歴を受け取り、次のAI発話を1つ返す。
 * 進行（設問・ターン）はサーバ側で決める。宿題フェーズがOPENのときのみ利用可。
 */

const HISTORY_LIMIT = 24;

function sanitize(messages: unknown): ChatMessage[] {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter(
      (m): m is ChatMessage =>
        typeof m === "object" &&
        m !== null &&
        (m as ChatMessage).role !== undefined &&
        typeof (m as ChatMessage).content === "string"
    )
    .map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content.slice(0, 4000),
      questionIndex: typeof m.questionIndex === "number" ? m.questionIndex : undefined,
      turn: typeof m.turn === "number" ? m.turn : undefined,
    }));
}

export async function POST(request: Request) {
  const { ok } = await canAccessPhase("homework");
  if (!ok) {
    return NextResponse.json(
      { error: "この課題はまだ開放されていません。" },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const messages = sanitize((body as { messages?: unknown }).messages);

  const previous = stateFromMessages(messages);
  const state = nextState(previous);

  const history = messages.slice(-HISTORY_LIMIT).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const instruction = buildTurnInstruction(state);
  const aiMessages =
    history.length === 0
      ? [{ role: "user" as const, content: instruction }]
      : [...history, { role: "user" as const, content: instruction }];

  const raw = await complete({
    system: buildSystemPrompt(),
    messages: aiMessages,
    maxTokens: 1000,
  });

  const source: ChatResponse["source"] = raw ? "ai" : "scripted";
  const text = raw ?? scriptedTurn(messages, state);
  const parsed = parseQuickReplies(text);

  const payload: ChatResponse = {
    message: parsed.text,
    quickReplies: parsed.quickReplies,
    state,
    source,
  };
  return NextResponse.json(payload);
}
