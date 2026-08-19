"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WorksheetStage } from "@/components/worksheet/WorksheetStage";
import { InterviewChat } from "./InterviewChat";
import type { ChatMessage, ExcursionData } from "@/lib/homework/excursion/types";

const EMPTY_EXCURSION: ExcursionData = {
  stage: "interview",
  messages: [],
  decision: null,
};

async function saveExcursion(patch: Partial<ExcursionData>) {
  await fetch("/api/workshop/me/homework", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ excursion: patch }),
  }).catch(() => {});
}

/**
 * プチ越境体験(a)の「AIインタビュー」段階のみ。
 * 「企画を練る」カードから入る。
 * 完了は「AI対話を終える」ボタン（明示的なユーザー操作）でのみ起きる——AIの返答内容で
 * 自動遷移すると、対話の乱れで何度も確認が表示され不安定になったため。
 * 完了後は体験レポートへは飛ばさず宿題トップへ戻す（レポートは実際にやってみた後に
 * 書くもの。決定済みになれば宿題トップの「計画と実施レポート」カードが解放される）。
 */
export function ExcursionClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    (async () => {
      const d = await fetch("/api/workshop/me", { credentials: "include" })
        .then((r) => r.json())
        .catch(() => ({}));
      const excursion = d?.workshopData?.homework?.excursion as ExcursionData | undefined;
      if (excursion?.messages?.length) setMessages(excursion.messages);
      setLoading(false);
    })();
  }, []);

  const handleProgress = (next: ChatMessage[]) => {
    setMessages(next);
    void saveExcursion({ stage: "interview", messages: next, decision: null });
  };

  const handleFinish = (next: ChatMessage[], summary: string) => {
    // AIがMarkdown装飾を混ぜてくることがあるので、保険として取り除く
    const cleaned = summary.replace(/\*\*/g, "").trim();
    void saveExcursion({
      stage: "report",
      messages: next,
      decision: { summary: cleaned },
    }).then(() => router.push("/workshop/homework"));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  return (
    <WorksheetStage>
      <div className="w-full max-w-3xl">
        <header className="no-print mb-6">
          <p className="eyebrow">宿題(a)</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            プチ体験の企画を練る
          </h1>
          <p className="mt-1.5 text-sm text-secondary-foreground">
            AIとの対話で、プチ越境体験の内容を決めましょう
          </p>
        </header>
        <InterviewChat initialMessages={messages} onProgress={handleProgress} onFinish={handleFinish} />
      </div>
    </WorksheetStage>
  );
}
