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
    <header className="no-print sticky top-0 z-10 border-b border-[rgba(0,255,136,0.2)] bg-[#0a0e1a]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0a0e1a]/80">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 md:px-8">
        <Link
          href="/workshop"
          className="text-sm font-medium text-[#a0c0b0] hover:text-[#00ff88]"
        >
          サードエイジ じぶん戦略講座
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="rounded-lg px-3 py-1.5 text-sm text-[#a0c0b0] transition hover:bg-[#0f1420] hover:text-[#e0f0e8] disabled:opacity-60"
        >
          {loggingOut ? "ログアウト中..." : "ログアウト"}
        </button>
      </div>
    </header>
  );
}
