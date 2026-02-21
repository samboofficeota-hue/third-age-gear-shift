"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Block5Page() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/workshop/me", { credentials: "include" });
      if (res.status === 401) {
        window.location.href = "/login?from=/workshop/block-5";
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
          <Link href="/workshop/block-4" className="text-community hover:underline">
            ← Block 4
          </Link>
          {" · "}
          STEP 5：4つの資本の監査
        </p>
        <section className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
          <h1 className="mb-4 text-xl font-bold text-stone-800">
            STEP 5：4つの資本の監査
          </h1>
          <p className="text-stone-600">
            時間・人的・社会・金融の4資本の現状把握と、資本フロー図の表示、滞留ポイントの可視化は準備中です。
          </p>
          <div className="mt-6 flex gap-3">
            <Link href="/workshop/block-4" className="rounded-xl border border-stone-300 px-4 py-2 text-stone-600">
              Block 4 に戻る
            </Link>
            <Link href="/workshop/block-6" className="rounded-xl bg-community px-4 py-2 text-white">
              次へ（Block 6）
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
