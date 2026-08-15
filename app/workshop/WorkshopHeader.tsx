"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BRAND } from "@/lib/brand";

export function WorkshopHeader() {
  const [loggingOut, setLoggingOut] = useState(false);
  const pathname = usePathname();
  const showGuideLink = pathname?.startsWith("/workshop/pre") ?? false;

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
    <header className="no-print sticky top-0 z-10 border-b border-border bg-bg-dark/95 backdrop-blur supports-[backdrop-filter]:bg-bg-dark/80">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 md:px-8">
        <Link
          href="/workshop"
          className="text-sm font-medium text-secondary-foreground hover:text-neon"
        >
          {BRAND.name}
        </Link>
        <div className="flex items-center gap-4">
          {showGuideLink && (
            <Link
              href="/workshop/guide"
              className="text-xs text-secondary-foreground hover:text-foreground"
            >
              ガイドに戻る
            </Link>
          )}
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-lg px-3 py-1.5 text-xs text-secondary-foreground transition hover:bg-bg-panel hover:text-foreground disabled:opacity-60"
          >
            {loggingOut ? "ログアウト中..." : "ログアウト"}
          </button>
        </div>
      </div>
    </header>
  );
}
