"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * 宿題の「提出する」ボタン。homework.submittedAt に提出時刻を記録してからガイドへ戻る。
 * （completedPhases は1か所でも保存すると立つため、提出の記録には使えない）
 */
export function SubmitHomeworkButton({ submitted }: { submitted: boolean }) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/workshop/me/homework", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submittedAt: new Date().toISOString() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "提出できませんでした。");
      }
      router.push("/workshop/guide");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "提出できませんでした。");
      setSending(false);
    }
  };

  return (
    <>
      <Button onClick={submit} disabled={sending}>
        {sending ? "提出しています..." : submitted ? "もう一度提出する" : "宿題を提出する"}
        <Send className="h-4 w-4" />
      </Button>
      {error && <p className="text-caption text-destructive">{error}</p>}
    </>
  );
}
