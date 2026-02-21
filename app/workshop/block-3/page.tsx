"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const WORKS = [
  { id: "D", label: "D. 学習", color: "#86efac" },
  { id: "C", label: "C. ギフト", color: "#52c47a" },
  { id: "B", label: "B. 家事", color: "#2e9e5b" },
  { id: "A", label: "A. 有償", color: "#1a6b3a" },
] as const;

type Step3Data = {
  future_D?: number;
  future_C?: number;
  future_B?: number;
  future_A?: number;
  will_do?: string;
  will_quit?: string;
};

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

export default function Block3Page() {
  const [step, setStep] = useState<"intro" | "sliders" | "compare" | "will">("intro");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step1, setStep1] = useState<Record<string, number>>({});
  const [step2Allocation, setStep2Allocation] = useState<Record<string, AllocationRow>>({});
  const [future, setFuture] = useState<Step3Data>({
    future_D: 5,
    future_C: 5,
    future_B: 20,
    future_A: 70,
  });
  const [willDo, setWillDo] = useState("");
  const [willQuit, setWillQuit] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/workshop/me", { credentials: "include" });
      if (res.status === 401) {
        window.location.href = "/login?from=/workshop/block-3";
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
        const s = w.step3 as Step3Data;
        setFuture({
          future_D: s.future_D ?? 5,
          future_C: s.future_C ?? 5,
          future_B: s.future_B ?? 20,
          future_A: s.future_A ?? 70,
        });
        setWillDo(s.will_do ?? "");
        setWillQuit(s.will_quit ?? "");
      }
      setLoading(false);
    })();
  }, []);

  const currentPct = useMemo(() => {
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
    if (total === 0) return { A: 25, B: 25, C: 25, D: 25 };
    return {
      A: Math.round((hours.A / total) * 100),
      B: Math.round((hours.B / total) * 100),
      C: Math.round((hours.C / total) * 100),
      D: Math.round((hours.D / total) * 100),
    };
  }, [step1, step2Allocation]);

  const futurePct = useMemo(() => {
    let D = Math.max(0, Math.min(50, future.future_D ?? 0));
    let C = Math.max(0, Math.min(40, future.future_C ?? 0));
    let B = Math.max(0, Math.min(40, future.future_B ?? 0));
    let A = 100 - D - C - B;
    A = Math.max(0, Math.min(100, A));
    const sum = A + B + C + D;
    if (sum !== 100) {
      D = Math.round((D / sum) * 100);
      C = Math.round((C / sum) * 100);
      B = Math.round((B / sum) * 100);
      A = 100 - D - C - B;
    }
    return { A, B, C, D };
  }, [future.future_D, future.future_C, future.future_B]);

  const currentPieData = useMemo(
    () =>
      WORKS.map((w) => ({
        name: w.label,
        value: currentPct[w.id as keyof typeof currentPct],
        color: w.color,
      })),
    [currentPct]
  );
  const futurePieData = useMemo(
    () =>
      WORKS.map((w) => ({
        name: w.label,
        value: futurePct[w.id as keyof typeof futurePct],
        color: w.color,
      })),
    [futurePct]
  );

  const saveStep3 = async (extra?: { will_do?: string; will_quit?: string }) => {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/workshop/me/step3", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        future_D: future.future_D,
        future_C: future.future_C,
        future_B: future.future_B,
        future_A: futurePct.A,
        ...extra,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "保存に失敗しました。");
      return false;
    }
    return true;
  };

  const handleToSliders = () => setStep("sliders");
  const handleToCompare = () => setStep("compare");
  const handleToWill = async () => {
    const ok = await saveStep3();
    if (ok) setStep("will");
  };
  const handleWillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await saveStep3({ will_do: willDo.trim(), will_quit: willQuit.trim() });
    if (ok) window.location.href = "/workshop/block-4";
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
          <Link href="/workshop/block-2" className="text-community hover:underline">
            ← Block 2
          </Link>
          {" · "}
          STEP 3：10年後のポートフォリオ設計
        </p>

        {/* 3-A: 導入 */}
        {step === "intro" && (
          <section className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
            <div className="mb-6 flex justify-center">
              <div className="h-24 w-24 rounded-full bg-community-light opacity-90" aria-hidden />
            </div>
            <h1 className="mb-4 text-center text-xl font-bold text-stone-800">ミッチー</h1>
            <p className="mb-4 leading-relaxed text-stone-700">
              これからが本番です。10年後、あなたはどんな時間の使い方をしていたいですか？
            </p>
            <p className="mb-6 rounded-lg bg-community-lighter/20 p-3 text-sm text-stone-700">
              <strong>重要：</strong> D→C→B→A の順で決めてください。未来の自分への投資（学習・ギフト）から確定させ、残りを有償ワークにします。
            </p>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleToSliders}
                className="rounded-xl bg-community px-6 py-3 text-white transition hover:bg-community-light"
              >
                10年後の比率を決める
              </button>
            </div>
          </section>
        )}

        {/* 3-B: スライダー */}
        {step === "sliders" && (
          <section className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-lg font-bold text-stone-800">10年後の理想（%）</h2>
            <div className="space-y-6">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">D. 学習（0〜50%）</label>
                <p className="mb-2 text-xs text-stone-500">10年後、どんなことを学んでいたいですか？</p>
                <input
                  type="range"
                  min={0}
                  max={50}
                  value={future.future_D ?? 0}
                  onChange={(e) => setFuture((f) => ({ ...f, future_D: parseInt(e.target.value, 10) }))}
                  className="w-full"
                />
                <span className="text-sm font-medium text-stone-700">{future.future_D ?? 0}%</span>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">C. ギフト（0〜40%）</label>
                <p className="mb-2 text-xs text-stone-500">社会や誰かのために、何かしていたいことはありますか？</p>
                <input
                  type="range"
                  min={0}
                  max={40}
                  value={future.future_C ?? 0}
                  onChange={(e) => setFuture((f) => ({ ...f, future_C: parseInt(e.target.value, 10) }))}
                  className="w-full"
                />
                <span className="text-sm font-medium text-stone-700">{future.future_C ?? 0}%</span>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">B. 家事（0〜40%）</label>
                <p className="mb-2 text-xs text-stone-500">家庭での役割は、10年後どう変わっていると思いますか？</p>
                <input
                  type="range"
                  min={0}
                  max={40}
                  value={future.future_B ?? 0}
                  onChange={(e) => setFuture((f) => ({ ...f, future_B: parseInt(e.target.value, 10) }))}
                  className="w-full"
                />
                <span className="text-sm font-medium text-stone-700">{future.future_B ?? 0}%</span>
              </div>
              <div className="rounded-lg bg-stone-100 p-3">
                <p className="text-sm font-medium text-stone-700">A. 有償（残り）</p>
                <p className="text-2xl font-bold text-stone-800">{futurePct.A}%</p>
                <p className="text-xs text-stone-500">D+C+Bの合計から自動。これでよいですか？</p>
              </div>
            </div>
            {futurePct.A + futurePct.B + futurePct.C + futurePct.D !== 100 && (
              <p className="mt-2 text-sm text-amber-700">合計が100%になるよう調整してください。</p>
            )}
            {error && <p className="mt-4 text-sm text-red-600" role="alert">{error}</p>}
            <div className="mt-8 flex justify-end gap-3">
              <button type="button" onClick={() => setStep("intro")} className="rounded-xl border border-stone-300 px-4 py-2 text-stone-600">戻る</button>
              <button type="button" onClick={handleToCompare} className="rounded-xl bg-community px-6 py-2 text-white">比較を見る</button>
            </div>
          </section>
        )}

        {/* 3-C: 2画面比較 */}
        {step === "compare" && (
          <section className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-lg font-bold text-stone-800">現在 vs 10年後</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <p className="mb-2 text-center text-sm font-medium text-stone-600">現在（As-Is）</p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={currentPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="80%">
                        {currentPieData.map((_, i) => (
                          <Cell key={i} fill={currentPieData[i].color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => [`${v ?? 0}%`, ""]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                <p className="mb-2 text-center text-sm font-medium text-stone-600">10年後（To-Be）</p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={futurePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="80%">
                        {futurePieData.map((_, i) => (
                          <Cell key={i} fill={futurePieData[i].color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => [`${v ?? 0}%`, ""]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button type="button" onClick={() => setStep("sliders")} className="rounded-xl border border-stone-300 px-4 py-2 text-stone-600">戻る</button>
              <button type="button" onClick={handleToWill} disabled={saving} className="rounded-xl bg-community px-6 py-2 text-white disabled:opacity-60">
                {saving ? "保存中..." : "意志の言語化へ"}
              </button>
            </div>
          </section>
        )}

        {/* 3-D: 意志の言語化 */}
        {step === "will" && (
          <section className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-lg font-bold text-stone-800">意志の言語化</h2>
            <form onSubmit={handleWillSubmit} className="space-y-6">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  増やした時間で、具体的に何をやってみたいですか？
                </label>
                <textarea
                  value={willDo}
                  onChange={(e) => setWillDo(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2"
                  placeholder="自由に書いてください"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  理想の時間を確保するために、今、何を本気で辞めたいですか？
                </label>
                <textarea
                  value={willQuit}
                  onChange={(e) => setWillQuit(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2"
                  placeholder="自由に書いてください"
                />
              </div>
              {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setStep("compare")} className="rounded-xl border border-stone-300 px-4 py-2 text-stone-600">戻る</button>
                <button type="submit" disabled={saving} className="rounded-xl bg-community px-6 py-2 text-white disabled:opacity-60">
                  {saving ? "保存中..." : "STEP 4 へ進む"}
                </button>
              </div>
            </form>
          </section>
        )}
      </div>
    </div>
  );
}
