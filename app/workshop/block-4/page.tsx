"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

const WORKS = [
  { id: "D", label: "D. 学習", color: "#86efac" },
  { id: "C", label: "C. ギフト", color: "#52c47a" },
  { id: "B", label: "B. 家事", color: "#2e9e5b" },
  { id: "A", label: "A. 有償", color: "#1a6b3a" },
] as const;

const CATEGORIES = [
  "paid_work_hours",
  "home_work_hours",
  "care_hours",
  "study_hours",
  "leisure_hours",
  "other_hours",
] as const;

type AllocationRow = { A: number; B: number; C: number; D: number };

function normalizeRow(row: AllocationRow | undefined): AllocationRow {
  if (!row) return { A: 100, B: 0, C: 0, D: 0 };
  const a = Math.max(0, row.A ?? 0);
  const b = Math.max(0, row.B ?? 0);
  const c = Math.max(0, row.C ?? 0);
  const d = Math.max(0, row.D ?? 0);
  const sum = a + b + c + d || 1;
  return {
    A: Math.round((a / sum) * 100),
    B: Math.round((b / sum) * 100),
    C: Math.round((c / sum) * 100),
    D: Math.round((d / sum) * 100),
  };
}

export default function Block4Page() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step1, setStep1] = useState<Record<string, number>>({});
  const [step2Allocation, setStep2Allocation] = useState<Record<string, AllocationRow>>({});
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
      if (w?.step1 && typeof w.step1 === "object") {
        const s = w.step1 as Record<string, number>;
        setStep1({
          paid_work_hours: s.paid_work_hours ?? 0,
          home_work_hours: s.home_work_hours ?? 0,
          care_hours: s.care_hours ?? 0,
          study_hours: s.study_hours ?? 0,
          leisure_hours: s.leisure_hours ?? 0,
          other_hours: s.other_hours ?? 0,
        });
      }
      if (w?.step2?.allocation && typeof w.step2.allocation === "object") {
        const alloc: Record<string, AllocationRow> = {};
        for (const key of CATEGORIES) {
          const row = w.step2.allocation[key];
          if (row && typeof row === "object") alloc[key] = normalizeRow(row as AllocationRow);
        }
        setStep2Allocation(alloc);
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

  const { currentHours, currentTotal, futurePct, futureHours } = useMemo(() => {
    const hours: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
    let total = 0;
    for (const key of CATEGORIES) {
      const h = Number(step1[key]) || 0;
      total += h;
      const row = normalizeRow(step2Allocation[key]);
      hours.A += (h * (row.A || 0)) / 100;
      hours.B += (h * (row.B || 0)) / 100;
      hours.C += (h * (row.C || 0)) / 100;
      hours.D += (h * (row.D || 0)) / 100;
    }
    const baseTotal = total || 500;
    let fD = Math.max(0, Math.min(50, step3.future_D ?? 0));
    let fC = Math.max(0, Math.min(40, step3.future_C ?? 0));
    let fB = Math.max(0, Math.min(40, step3.future_B ?? 0));
    let fA = 100 - fD - fC - fB;
    fA = Math.max(0, fA);
    const fSum = fD + fC + fB + fA;
    if (fSum !== 100 && fSum > 0) {
      fD = Math.round((fD / fSum) * 100);
      fC = Math.round((fC / fSum) * 100);
      fB = Math.round((fB / fSum) * 100);
      fA = 100 - fD - fC - fB;
    }
    const futurePct = { A: fA, B: fB, C: fC, D: fD };
    const futureHours = {
      A: Math.round((baseTotal * fA) / 100 * 10) / 10,
      B: Math.round((baseTotal * fB) / 100 * 10) / 10,
      C: Math.round((baseTotal * fC) / 100 * 10) / 10,
      D: Math.round((baseTotal * fD) / 100 * 10) / 10,
    };
    return {
      currentHours: hours,
      currentTotal: total,
      futurePct,
      futureHours,
    };
  }, [step1, step2Allocation, step3]);

  const baseTotal = currentTotal || 500;
  const tableRows = useMemo(() => {
    return WORKS.map((w) => {
      const id = w.id as keyof typeof currentHours;
      const curH = Math.round((currentHours[id] ?? 0) * 10) / 10;
      const curP = baseTotal ? Math.round(((currentHours[id] ?? 0) / baseTotal) * 100) : 0;
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
  }, [currentHours, futureHours, futurePct, baseTotal]);

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

          {/* 4-B: ミッチーコメント */}
          <div className="mt-8 rounded-xl border border-stone-100 bg-stone-50/50 p-6">
            <h2 className="mb-2 text-sm font-bold text-stone-600">ミッチーからのコメント</h2>
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
