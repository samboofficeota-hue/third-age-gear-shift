// APIキー未設定時 / API障害時のフォールバック。
// AIなしでも4問の対話を一周できるよう、定型の問いかけを返す。
// （道場と違い、ここでは「越境」の定義を教えないことが最重要ルールなので、
//  フォールバックでも説明は入れない。）

import { questionForIndex } from "./ladder";
import type { ChatMessage, LadderState } from "./types";

function lastUserMessage(messages: ChatMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === "user") return messages[i].content.trim();
  }
  return "";
}

function excerpt(text: string, max = 40): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

export function scriptedTurn(messages: ChatMessage[], state: LadderState): string {
  const last = lastUserMessage(messages);

  if (state.phase !== "interview") {
    const summary = last !== "" ? excerpt(last, 50) : "今日決めたこと";
    return [
      `いいですね。「${summary}」を、あなたのプチ越境体験にしてみましょう。合っていますか？`,
      "[QUICK_REPLIES: はい、それでやってみる | もう少し考えたい]",
    ].join("\n");
  }

  const q = questionForIndex(state.questionIndex);
  const isMainTurn = state.turn === 1;

  if (isMainTurn) {
    const opener = state.questionIndex === 0 ? "こんにちは。少しだけ、一緒に考えさせてください。\n\n" : "";
    return `${opener}${q.label}`;
  }

  switch (state.questionIndex) {
    case 0:
      return `もう少しだけ聞かせてください。「${excerpt(last, 40)}」とのことですが、具体的にはどんな場所を思い浮かべますか？`;
    case 1:
      return "そこにいる人たちは、どんな表情や様子をしていそうですか？";
    case 2:
      return "それは、なぜふだんはやらないんだと思いますか？";
    case 3:
    default:
      return `「${excerpt(last, 40)}」ですね。いつ頃、実際にやってみられそうですか？`;
  }
}
