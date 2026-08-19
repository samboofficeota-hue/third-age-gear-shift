// 宿題(a) プチ越境体験 — 「AIインタビュー」段階の型定義。
// サードエイジ・キャンパス「道場」の壁打ちAI設計を、プチ越境体験向けに
// 4問の軽い連続対話へ作り替えて移植したもの。

export type ChatRole = "assistant" | "user";

export type ChatMessage = {
  role: ChatRole;
  content: string;
  /** assistant の発話が何問目・何ターン目だったか */
  questionIndex?: number;
  turn?: number;
};

export type InterviewPhase = "interview" | "closing" | "done";

export type LadderState = {
  /** 0〜3（Q1〜Q4） */
  questionIndex: number;
  /** 1〜TURNS_PER_QUESTION */
  turn: number;
  phase: InterviewPhase;
};

export type ChatRequest = {
  messages: ChatMessage[];
};

export type ChatResponse = {
  message: string;
  quickReplies: string[];
  state: LadderState;
  /** AIが応答したか、APIキー未設定等でスクリプト応答になったか */
  source: "ai" | "scripted";
};

/** Q4（どこでどんなプチ越境体験をするか）で本人が決めた内容 */
export type ExcursionDecision = {
  /** 対話の最後にAIが要約した一文 */
  summary: string;
};

/** WorkshopData.homework.excursion に保存する形 */
export type ExcursionData = {
  stage: "interview" | "report";
  messages: ChatMessage[];
  decision: ExcursionDecision | null;
  report?: {
    place?: string;
    /** 人たち＋行動（どんな人が、どんな行動をしているか、を1つにまとめる） */
    people?: string;
    photo?: string;
    /** 感想（率直にどう思った／みんなはなんでやってるのだろう、を1つにまとめる） */
    impression?: string;
  };
};
