"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

/**
 * ミッチーの歓迎メッセージ枠。
 * 生成済み(initial)があれば即表示。無ければマウント時に生成APIを1回叩く。
 */
export function MicchiMessage({ initial }: { initial: string | null }) {
  const [msg, setMsg] = useState(initial ?? "");
  const [loading, setLoading] = useState(!initial);

  useEffect(() => {
    if (initial) return;
    let active = true;
    (async () => {
      try {
        const r = await fetch("/api/workshop/me/pre/welcome", {
          method: "POST",
          credentials: "include",
        });
        const d = await r.json().catch(() => ({}));
        if (active && typeof d.message === "string") setMsg(d.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [initial]);

  return (
    <div className="mt-5 rounded-xl border border-primary/25 bg-primary/5 p-4 text-left">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
        </span>
        <span className="text-xs font-bold text-primary">
          AIナビゲーター ミッチー
        </span>
      </div>
      <p className="mt-2.5 whitespace-pre-line text-sm leading-relaxed text-[#e0f0e8]">
        {loading ? (
          <span className="text-muted-foreground">
            ミッチーがメッセージを準備中…
          </span>
        ) : (
          msg
        )}
      </p>
    </div>
  );
}
