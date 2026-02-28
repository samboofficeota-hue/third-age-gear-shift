"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

const WORKS = [
  { id: "D", label: "D. 学習",   color: "#F97316" },  // orange — D. 学習
  { id: "C", label: "C. ギフト", color: "#2E9E5B" },  // green  — C. ギフト
  { id: "B", label: "B. 家事",   color: "#3B82F6" },  // blue   — B. 家事
  { id: "A", label: "A. 有償",   color: "#78716C" },  // stone  — A. 有償
] as const;

type WorkTotals = { A: number; B: number; C: number; D: number; E: number };

export default function Block4Page() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step2Totals, setStep2Totals] = useState<WorkTotals>({ A: 0, B: 0, C: 0, D: 0, E: 0 });
  const [step3, setStep3] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/workshop/me", { credentials: "include" });
      if (res.status === 401) {
        window.location.href = "/login?from=/workshop/block-4";
        return;
      }
      const data = await res.json();
      const w = data.workshopData;
      if (w?.step2?.totals && typeof w.step2.totals === "object") {
        const t = w.step2.totals as WorkTotals;
        setStep2Totals({
          A: Number(t.A) || 0,
          B: Number(t.B) || 0,
          C: Number(t.C) || 0,
          D: Number(t.D) || 0,
          E: Number(t.E) || 0,
        });
      }
      if (w?.step3 && typeof w.step3 === "object") {
        const s = w.step3 as Record<string, number>;
        setStep3({
          future_D: s.future_D ?? 0,
          future_C: s.future_C ?? 0,
          future_B: s.future_B ?? 0,
          future_A: s.future_A ?? 0,
        });
      }
      setLoading(false);
    })();
  }, []);

  const { currentHours, adTotal, futurePct, futureHours } = useMemo(() => {
    // 現在の時間（step2.totalsから直接取得）
    const currentHours = {
      A: step2Totals.A,
      B: step2Totals.B,
      C: step2Totals.C,
      D: step2Totals.D,
    };
    // A〜D の合計時間をベースに将来時間を計算
    const adTotal = step2Totals.A + step2Totals.B + step2Totals.C + step2Totals.D;
    const baseTotal = adTotal || 500;

    let fD = Math.max(0, Math.min(50, step3.future_D ?? 0));
    let fC = Math.max(0, Math.min(40, step3.future_C ?? 0));
    let fB = Math.max(0, Math.min(40, step3.future_B ?? 0));
    let fA = Math.max(0, 100 - fD - fC - fB);
    const futurePct = { A: fA, B: fB, C: fC, D: fD };
    const futureHours = {
      A: Math.round((baseTotal * fA) / 100 * 10) / 10,
      B: Math.round((baseTotal * fB) / 100 * 10) / 10,
      C: Math.round((baseTotal * fC) / 100 * 10) / 10,
      D: Math.round((baseTotal * fD) / 100 * 10) / 10,
    };
    return { currentHours, adTotal, futurePct, futureHours };
  }, [step2Totals, step3]);

  const tableRows = useMemo(() => {
    const base = adTotal || 500;
    return WORKS.map((w) => {
      const id = w.id as keyof typeof currentHours;
      const curH = Math.round((currentHours[id] ?? 0) * 10) / 10;
      const curP = base ? Math.round(((currentHours[id] ?? 0) / base) * 100) : 0;
      const futH = futureHours[id] ?? 0;
      const futP = futurePct[id] ?? 0;
      const delta = Math.round((futH - curH) * 10) / 10;
      return {
        label: w.label,
        asIsHours: curH,
        asIsPct: curP,
        toBeHours: futH,
        toBePct: futP,
        delta,
      };
    });
  }, [currentHours, futureHours, futurePct, adTotal]);

  const investmentDelta = useMemo(() => {
    const cur = (currentHours.D ?? 0) + (currentHours.C ?? 0);
    const fut = (futureHours.D ?? 0) + (futureHours.C ?? 0);
    return Math.round((fut - cur) * 10) / 10;
  }, [currentHours, futureHours]);

  const saveStep4 = async () => {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/workshop/me/step4", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day1_comment: "" }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "保存に失敗しました。");
      return false;
    }
    return true;
  };

  const handleDay2 = () => {
    window.location.href = "/workshop/block-5";
  };

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
          <Link href="/workshop/block-3" className="text-community hover:underline">
            ← Block 3
          </Link>
          {" · "}
          STEP 4：As-Is / To-Be サマリー
        </p>

        {/* 4-A: 比較ダッシュボード */}
        <section className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
          <h1 className="mb-6 text-xl font-bold text-stone-800">DAY 1 まとめ</h1>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="pb-2 text-left font-medium text-stone-600">項目</th>
                  <th className="pb-2 text-right font-medium text-stone-600">As-Is（現在）</th>
                  <th className="pb-2 text-right font-medium text-stone-600">To-Be（10年後）</th>
                  <th className="pb-2 text-right font-medium text-stone-600">Δ変化</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row) => (
                  <tr key={row.label} className="border-b border-stone-100">
                    <td className="py-2 text-stone-800">{row.label}</td>
                    <td className="py-2 text-right text-stone-600">
                      {row.asIsHours} 時間（{row.asIsPct}%）
                    </td>
                    <td className="py-2 text-right text-stone-600">
                      {row.toBeHours} 時間（{row.toBePct}%）
                    </td>
                    <td className={`py-2 text-right font-medium ${row.delta >= 0 ? "text-community" : "text-stone-700"}`}>
                      {row.delta >= 0 ? "+" : ""}{row.delta} 時間
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 rounded-lg bg-community-lighter/20 px-3 py-2 text-sm text-stone-700">
            <strong>投資時間（D+C）の変化：</strong> {investmentDelta >= 0 ? "+" : ""}{investmentDelta} 時間
          </p>

          {/* 4-B: コメント */}
          <div className="mt-8 rounded-xl border border-stone-100 bg-stone-50/50 p-6">
            <p className="leading-relaxed text-stone-700">
              10年後、学習とギフトに今より{" "}
              <strong>{investmentDelta >= 0 ? "+" : ""}{investmentDelta} 時間</strong>{" "}
              多く投資することを選びましたね。それはどんな未来につながると思いますか？ DAY 2 では、4つの資本とその循環を一緒に見ていきましょう。
            </p>
          </div>

          {/* 4-C: 保存 & DAY 2 */}
          {error && (
            <p className="mt-4 text-sm text-red-600" role="alert">{error}</p>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={saveStep4}
              disabled={saving}
              className="rounded-xl border border-stone-300 px-4 py-2 text-stone-600 disabled:opacity-60"
            >
              {saving ? "保存中..." : "ここまでを保存する"}
            </button>
            <button
              type="button"
              onClick={handleDay2}
              className="rounded-xl bg-community px-6 py-3 text-white transition hover:bg-community-light"
            >
              DAY 2 へ進む
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
