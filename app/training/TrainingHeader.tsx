"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BRAND } from "@/lib/brand";

/**
 * 研修本番（Program B）用の白基調ヘッダー。
 * 事前/事後のダークヘッダー（WorkshopHeader）とは別系統。
 */
export function TrainingHeader() {
  const [loggingOut, setLoggingOut] = useState(false);
  const pathname = usePathname();
  const showGuideLink = pathname !== "/training";

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      window.location.href = "/";
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="no-print sticky top-0 z-10 border-b border-ws-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-3">
          <Link
            href="/training"
            className="text-sm font-bold text-ws-ink hover:text-ws-teal"
          >
            {BRAND.name}
          </Link>
          <span className="rounded-full bg-ws-mint px-2 py-0.5 text-caption font-semibold text-ws-teal">
            研修当日用
          </span>
        </div>
        <div className="flex items-center gap-4">
          {showGuideLink && (
            <Link
              href="/training"
              className="text-xs text-ws-muted hover:text-ws-ink"
            >
              ガイドに戻る
            </Link>
          )}
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
