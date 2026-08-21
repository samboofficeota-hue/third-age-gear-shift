"use client";

import Link from "next/link";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { BRAND } from "@/lib/brand";

/**
 * 管理画面の外枠。
 *
 * ここで `.admin-theme` を被せることで、この配下だけ shadcn のトークンが
 * 白地パレットに差し替わる（globals.css）。管理画面側のコンポーネントは
 * bg-card / text-muted-foreground などのトークンだけを使えばよい。
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
    <div className="admin-theme flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-border bg-card">
        <div className="flex h-14 items-center justify-between gap-4 px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/admin"
              className="flex items-center gap-2.5 text-sm font-bold text-foreground"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                管
              </span>
              管理ダッシュボード
            </Link>
            <span className="hidden truncate text-xs text-muted-foreground sm:inline">
              {BRAND.name}
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" />
            {loggingOut ? "ログアウト中..." : "ログアウト"}
          </button>
        </div>
      </header>
      {children}
    </div>
  );
}
