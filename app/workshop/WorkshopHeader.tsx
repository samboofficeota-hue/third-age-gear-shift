"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BRAND } from "@/lib/brand";

export function WorkshopHeader() {
  const [loggingOut, setLoggingOut] = useState(false);
  const pathname = usePathname() ?? "";

  // 宿題の入力パート（扉のサブページ）は「宿題トップへ戻る」に統一。
  // 事前課題のサブページは、これまでどおり「ガイドに戻る」。
  const backLink = pathname.startsWith("/workshop/homework/")
    ? { href: "/workshop/homework", label: "宿題トップへ戻る" }
    : pathname.startsWith("/workshop/pre")
      ? { href: "/workshop/guide", label: "ガイドに戻る" }
      : null;

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
          {backLink && (
            <Link
              href={backLink.href}
              className="text-xs text-secondary-foreground hover:text-foreground"
            >
              {backLink.label}
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
