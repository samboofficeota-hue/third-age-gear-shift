"use client";

import Link from "next/link";
import { useState } from "react";

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
    <>
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="text-sm font-bold text-stone-800 hover:text-stone-900"
            >
              管理ダッシュボード
            </Link>
            <span className="text-xs text-stone-400">|</span>
            <span className="text-xs text-stone-500">サードエイジへのギア・シフト</span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-lg px-3 py-1.5 text-sm text-stone-600 transition hover:bg-stone-100 hover:text-stone-800 disabled:opacity-60"
          >
            {loggingOut ? "ログアウト中..." : "ログアウト"}
          </button>
        </div>
      </header>
      <main className="min-h-screen bg-stone-50">{children}</main>
    </>
  );
}
