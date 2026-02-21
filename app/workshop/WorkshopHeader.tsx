"use client";

import Link from "next/link";
import { useState } from "react";

export function WorkshopHeader() {
  const [loggingOut, setLoggingOut] = useState(false);

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
    <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 md:px-8">
        <Link
          href="/workshop/block-0"
          className="text-sm font-medium text-stone-700 hover:text-stone-900"
        >
          サードエイジへのギア・シフト
        </Link>
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
  );
}
