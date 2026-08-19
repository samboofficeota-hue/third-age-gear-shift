"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { AutosaveStatus } from "@/lib/hooks/useAutosave";

/**
 * 宿題フォーム共通の右下フロートバー。
 * 自動保存の状態バッジ＋「保存して戻る」ボタン（今の値を即保存してから遷移）。
 * 自動保存があっても「記入を終えて戻る」という区切りの操作が無いと不安になる、
 * という声から導入（2026-08-19）。
 */
export function HomeworkSaveBar({
  status,
  saveNow,
  returnHref = "/workshop/homework",
}: {
  status: AutosaveStatus;
  saveNow: () => Promise<boolean>;
  returnHref?: string;
}) {
  const router = useRouter();
  const [returning, setReturning] = useState(false);

  const handleReturn = async () => {
    setReturning(true);
    await saveNow();
    router.push(returnHref);
  };

  return (
    <div className="no-print fixed bottom-6 right-6 z-50 flex items-center gap-3">
      {!returning && status !== "idle" && (
        <span className="rounded-full bg-white/95 px-3 py-1.5 text-sm font-medium text-ws-teal shadow-md ring-1 ring-ws-line">
          {status === "saving" ? "保存中..." : "保存しました ✓"}
        </span>
      )}
      <Button onClick={handleReturn} disabled={returning} className="rounded-full px-6 shadow-lg">
        {returning ? "保存中..." : "保存して戻る"}
      </Button>
    </div>
  );
}
