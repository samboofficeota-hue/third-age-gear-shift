"use client";

import Link from "next/link";
import { useState } from "react";
import { BRAND } from "@/lib/brand";

/**
 * 投影ビューのヘッダー。
 *
 * 受講生の TrainingHeader と**同じ見た目**にして、投影したときに
 * 受講生が見ている画面と差が出ないようにする。変えるのは戻り先だけ。
 */
export function ViewHeader({
  backTo,
  backLabel,
  note,
}: {
  backTo: string;
  backLabel: string;
  /** 誰の画面を見ているか等（投影事故を防ぐための表示） */
  note?: string;
}) {
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      window.location.href = "/";
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="no-print sticky top-0 z-10 border-b border-ws-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 md:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <span className="text-sm font-bold text-ws-ink">{BRAND.name}</span>
          <span className="rounded-full bg-ws-mint px-2 py-0.5 text-caption font-semibold text-ws-teal">
            研修当日用
          </span>
          {note && <span className="truncate text-xs text-ws-muted">{note}</span>}
        </div>
        <div className="flex items-center gap-4">
          <Link href={backTo} className="whitespace-nowrap text-xs text-ws-muted hover:text-ws-ink">
            {backLabel}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-lg px-3 py-1.5 text-xs text-ws-muted transition hover:bg-ws-fill hover:text-ws-ink disabled:opacity-60"
          >
            {loggingOut ? "ログアウト中..." : "ログアウト"}
          </button>
        </div>
      </div>
    </header>
  );
}
