// 4問の軽い連続対話の進行管理。
// 道場の「8段ラダー×3論点・5分固定」を、プチ越境体験向けに
// 「1問＝メイン質問→必要なら1回だけ深掘り→次へ」の2ターン構成に簡略化した。
// 時間制限は設けない（「プチ」な意思決定支援のため）。クライアント/サーバ両方から
// 使うので、副作用を持たない純関数にしてある。

import type { ChatMessage, LadderState } from "./types";

export const QUESTION_COUNT = 4;
export const TURNS_PER_QUESTION = 2;

export const QUESTIONS = [
  {
    turn: 1,
    role: "起点",
    label: "アウェーな環境ってなんだろう",
    task: "「アウェーな環境」を本人の言葉で考えてもらう。ふだんの生活圏と対比させながら聞く",
  },
  {
    turn: 2,
    role: "展開",
    label: "そこでは何がおきてるのだろう",
    task: "その場所を具体的に想像してもらう。誰が何をしていそうか聞く",
  },
  {
    turn: 3,
    role: "自分ごと化",
    label: "自分だったらふだんやらないことはなんだろう",
    task: "本人がふだん避けていること・不慣れなことを引き出す",
  },
  {
    turn: 4,
    role: "決定",
    label: "どこでどんなプチ越境体験をしてみる？",
    task: "ここまでの話を踏まえ、具体的な場所と行動を一つに決めてもらう",
  },
] as const;

export function questionForIndex(index: number) {
  return QUESTIONS[Math.min(Math.max(index, 0), QUESTION_COUNT - 1)];
}

export function initialState(): LadderState {
  return { questionIndex: 0, turn: 1, phase: "interview" };
}

/** 直近の assistant 発話から、いまの進行位置を復元する */
export function stateFromMessages(messages: ChatMessage[]): LadderState | null {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const m = messages[i];
    if (m.role === "assistant" && typeof m.questionIndex === "number" && typeof m.turn === "number") {
      return {
        questionIndex: m.questionIndex,
        turn: m.turn,
        phase: m.questionIndex >= QUESTION_COUNT ? "closing" : "interview",
      };
    }
  }
  return null;
}

/**
 * 次にAIが担うべき進行位置を決める。
 * 1問＝2ターン（メイン質問→深掘り）。Q4（決定）の2ターン目まで進んだらクロージングへ。
 */
export function nextState(prev: LadderState | null): LadderState {
  if (!prev) return initialState();
  if (prev.phase === "done") return prev;
  if (prev.phase === "closing") return { ...prev, phase: "done" };

  let { questionIndex, turn } = prev;
  turn += 1;

  if (turn > TURNS_PER_QUESTION) {
    questionIndex += 1;
    turn = 1;
  }

  if (questionIndex >= QUESTION_COUNT) {
    return { questionIndex: QUESTION_COUNT, turn: TURNS_PER_QUESTION, phase: "closing" };
  }

  return { questionIndex, turn, phase: "interview" };
}

/** 進行率（0〜1）。プログレスバー用。 */
export function ladderProgress(state: LadderState): number {
  if (state.phase === "done") return 1;
  const done = state.questionIndex * TURNS_PER_QUESTION + (state.turn - 1);
  return Math.min(done / (QUESTION_COUNT * TURNS_PER_QUESTION), 1);
}
