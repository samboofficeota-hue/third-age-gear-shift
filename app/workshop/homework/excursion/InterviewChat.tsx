"use client";

// 第1段階：プチ越境体験の「AIインタビュー」。
// 「越境体験とは何か」を教えないまま、Q1〜Q4の対話だけで本人にプチ越境体験の
// 内容を決めてもらう（種明かしはDay2）。進行（設問・ターン）はサーバが決め、
// ここは表示と入力だけを持つ。
//
// レイアウトは1枚のチャットパネル（固定ヘッダー／スクロールする履歴／常に見える
// 入力欄）にまとめている。sticky＋別カードの組み合わせは、履歴が伸びたときに
// 最新のAI発話が隠れる不具合を起こしたため採用していない。

import { useCallback, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  QUESTION_COUNT,
  ladderProgress,
  questionForIndex,
  stateFromMessages,
} from "@/lib/homework/excursion/ladder";
import type {
  ChatMessage,
  ChatResponse,
  InterviewPhase,
  LadderState,
} from "@/lib/homework/excursion/types";

type Props = {
  initialMessages: ChatMessage[];
  onProgress: (messages: ChatMessage[]) => void;
  onFinish: (messages: ChatMessage[], summary: string) => void;
};

export function InterviewChat({ initialMessages, onProgress, onFinish }: Props) {
  const initialState = stateFromMessages(initialMessages);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [pending, setPending] = useState(false);
  // クイックリプライ自体は保存していないため、クロージング状態で再開したときは
  // 定型の2択を復元する（未確認のまま再読み込みしても選べるように）。
  const [quickReplies, setQuickReplies] = useState<string[]>(
    initialState?.phase === "closing" ? ["はい、それでやってみる", "もう少し考えたい"] : []
  );
  const [phase, setPhase] = useState<InterviewPhase>(initialState?.phase ?? "interview");
  const [questionIndex, setQuestionIndex] = useState(initialState?.questionIndex ?? 0);
  const [source, setSource] = useState<ChatResponse["source"] | null>(null);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  // クロージングの確認（「はい、それでやってみる」）を押したかどうか。
  // 押す前はクイックリプライだけ、押した後に「終える」ボタンだけを出す
  // ——同時に出すとどちらを押せばいいか迷うため、順番を分ける。
  const [confirmed, setConfirmed] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const openedRef = useRef(false);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
  }, [messages, pending]);

  const sendTurn = useCallback(
    async (userText: string | null) => {
      const base = messagesRef.current;
      const withUser: ChatMessage[] = userText
        ? [...base, { role: "user", content: userText }]
        : base;

      setMessages(withUser);
      setQuickReplies([]);
      setPending(true);
      setError(null);

      try {
        const res = await fetch("/api/workshop/me/homework/excursion/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ messages: withUser }),
        });
        if (!res.ok) throw new Error(`chat failed: ${res.status}`);
        const data = (await res.json()) as ChatResponse;

        const next: ChatMessage[] = [
          ...withUser,
          {
            role: "assistant",
            content: data.message,
            questionIndex: data.state.questionIndex,
            turn: data.state.turn,
          },
        ];
        setMessages(next);
        setQuickReplies(data.quickReplies);
        setPhase(data.state.phase);
        setQuestionIndex(Math.min(data.state.questionIndex, QUESTION_COUNT - 1));
        setSource(data.source);
        onProgress(next);
      } catch (e) {
        console.error(e);
        setMessages(withUser);
        setError("応答を受け取れませんでした。少し待ってから、もう一度お試しください。");
      } finally {
        setPending(false);
      }
    },
    [onProgress]
  );

  // AI対話の自動遷移（返答内容ベース）は、対話が乱れると何度も確認が
  // 表示され不安定だったため廃止。終了は必ずこのボタンからの明示操作にする。
  function finishInterview() {
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    onFinish(messages, lastAssistant?.content ?? "");
  }

  // 最初のAI発話を取りにいく
  useEffect(() => {
    if (openedRef.current) return;
    openedRef.current = true;
    if (messagesRef.current.length === 0) void sendTurn(null);
  }, [sendTurn]);

  function submit(text: string) {
    const trimmed = text.trim();
    if (trimmed === "" || pending) return;
    if (phase === "closing" && trimmed === "はい、それでやってみる") {
      setConfirmed(true);
    }
    setInput("");
    void sendTurn(trimmed);
  }

  const state: LadderState = { questionIndex, turn: 1, phase };
  const progress = ladderProgress(state);
  const currentQuestion = questionForIndex(questionIndex);

  return (
    <div className="flex h-[75vh] min-h-[520px] flex-col overflow-hidden rounded-xl border-2 border-border bg-card shadow-neon">
      {/* ヘッダー：常に表示（スクロールしない） */}
      <div className="shrink-0 border-b border-border p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">AIインタビュー</p>
            <h2 className="mt-1 text-lg font-bold text-foreground">どんなプチ越境体験にする？</h2>
          </div>
          <span className="rounded-full border-2 border-border bg-bg-panel px-3 py-1 text-xs font-semibold text-secondary-foreground">
            Q{Math.min(questionIndex + 1, QUESTION_COUNT)} / {QUESTION_COUNT}
          </span>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full border border-border bg-bg-panel">
          <div
            className="h-full rounded-full bg-primary shadow-neon-glow transition-all duration-500"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
        <p className="mt-2 text-caption text-muted-foreground">
          いま考えているのは：{currentQuestion.label}
        </p>

        {source === "scripted" && (
          <div className="callout mt-4">
            <p className="text-caption">
              簡易モードで動いています（AIの接続が設定されていないか、応答を取得できませんでした）。問いの流れは同じです。
            </p>
          </div>
        )}
      </div>

      {/* 履歴：ここだけスクロールする */}
      <div className="min-h-0 flex-1 overflow-y-auto bg-bg-panel/60 p-4 md:p-5">
        <div className="space-y-4">
          {messages.map((m, i) => (
            <div
              key={`${i}-${m.role}`}
              className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  m.role === "user"
                    ? "bg-primary text-bg-dark"
                    : "bg-bg-card text-primary ring-1 ring-border"
                }`}
                aria-hidden
              >
                {m.role === "user" ? "私" : "AI"}
              </span>
              <div
                className={`max-w-[80%] whitespace-pre-wrap rounded-xl border px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "border-primary/30 bg-primary/15 text-foreground"
                    : "border-border bg-card text-foreground"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {pending && (
            <div className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-card text-xs font-bold text-primary ring-1 ring-border">
                AI
              </span>
              <div className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground">
                …考えています
              </div>
            </div>
          )}

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* 入力欄：常に表示（スクロールしない） */}
      <div className="shrink-0 border-t border-border p-4">
        {confirmed ? (
          <div className="callout mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-caption">内容が決まりました。下のボタンで対話を終えましょう。</p>
            <Button onClick={finishInterview} className="shrink-0">
              AI対話を終えて、宿題トップへ戻る
            </Button>
          </div>
        ) : (
          quickReplies.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {quickReplies.map((reply) => (
                <button
                  key={reply}
                  type="button"
                  disabled={pending}
                  onClick={() => submit(reply)}
                  className="rounded-full border-2 border-border bg-bg-panel px-4 py-1.5 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary disabled:opacity-50"
                >
                  {reply}
                </button>
              ))}
            </div>
          )
        )}

        {!confirmed && (
          <>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit(input);
              }}
              className="flex items-end gap-2"
            >
              <textarea
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    submit(input);
                  }
                }}
                placeholder="思いついたまま、短くて構いません…"
                disabled={pending}
                className="min-w-0 flex-1 rounded-lg border border-border bg-bg-panel px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary disabled:opacity-60"
              />
              <Button type="submit" size="default" disabled={pending || input.trim() === ""}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <p className="mt-2 text-caption text-muted-foreground">
              ⌘/Ctrl + Enter でも送信できます
            </p>
          </>
        )}
      </div>
    </div>
  );
}
