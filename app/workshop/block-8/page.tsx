"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Block8Page() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/workshop/me", { credentials: "include" });
      if (res.status === 401) {
        window.location.href = "/login?from=/workshop/block-8";
        return;
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-stone-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-2xl">
        <p className="mb-4 text-sm text-stone-500">
          <Link href="/workshop/block-7" className="text-community hover:underline">
            ← Block 7
          </Link>
          {" · "}
          Block 8：自分の経営計画書
        </p>
        <section className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
          <h1 className="mb-4 text-xl font-bold text-stone-800">
            アウトプット：自分の経営計画書
          </h1>
          <p className="text-stone-600">
            全STEP内容のサマリー表示、ミッチーからのメッセージ、PDF出力は準備中です。
          </p>
          <div className="mt-6">
            <Link href="/workshop/block-7" className="rounded-xl border border-stone-300 px-4 py-2 text-stone-600">
              Block 7 に戻る
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
