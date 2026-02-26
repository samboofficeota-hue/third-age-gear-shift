"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
const WORKS = [
  { id: "D", label: "D. 学習",   color: "#d97706" },  // amber  (Block 2 と統一)
  { id: "C", label: "C. ギフト", color: "#2563eb" },  // blue
  { id: "B", label: "B. 家事",   color: "#e11d48" },  // rose
  { id: "A", label: "A. 有償",   color: "#1a6b3a" },  // green
  { id: "E", label: "E. その他", color: "#a8a29e" },  // stone (Block 2 と統一)
] as const;

type Step3Data = {
  future_D?: number;
  future_C?: number;
  future_B?: number;
  future_A?: number;
  will_do?: string;
  will_quit?: string;
};

// step2.totals から現在の比率を計算
type WorkTotals = { A: number; B: number; C: number; D: number; E: number };

export default function Block3Page() {
  const [step, setStep] = useState<"intro" | "sliders" | "compare" | "will">("intro");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step2Totals, setStep2Totals] = useState<WorkTotals>({ A: 0, B: 0, C: 0, D: 0, E: 0 });
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
      // step2.totals から現在の時間配分を取得（新フォーマット）
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
    const { A, B, C, D, E } = step2Totals;
    const total = A + B + C + D + E;
    if (total === 0) return { A: 0, B: 0, C: 0, D: 0, E: 0 };
    const pA = Math.round((A / total) * 100);
    const pB = Math.round((B / total) * 100);
    const pC = Math.round((C / total) * 100);
    const pD = Math.round((D / total) * 100);
    const pE = 100 - pA - pB - pC - pD; // 端数調整で合計100%を保証
    return { A: pA, B: pB, C: pC, D: pD, E: pE };
  }, [step2Totals]);

  const futurePct = useMemo(() => {
    // E は現在と同じ割合で固定
    const E = currentPct.E;
    const available = 100 - E; // A〜D で使える割合

    // ユーザー入力は「A〜D の中での比率」として available に掛ける
    const D_ratio = Math.max(0, Math.min(50, future.future_D ?? 0));
    const C_ratio = Math.max(0, Math.min(40, future.future_C ?? 0));
    const B_ratio = Math.max(0, Math.min(40, future.future_B ?? 0));
    const A_ratio = Math.max(0, 100 - D_ratio - C_ratio - B_ratio);

    const D = Math.round((D_ratio / 100) * available);
    const C = Math.round((C_ratio / 100) * available);
    const B = Math.round((B_ratio / 100) * available);
    const A = available - D - C - B; // 端数調整

    return { A: Math.max(0, A), B, C, D, E };
  }, [future.future_D, future.future_C, future.future_B, currentPct.E]);


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

        {/* 3-B: 数値入力 */}
        {step === "sliders" && (() => {
          const inputA = 100 - (future.future_D ?? 0) - (future.future_C ?? 0) - (future.future_B ?? 0);
          return (
          <section className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
            <h2 className="mb-2 text-lg font-bold text-stone-800">10年後の理想（%）</h2>
            <p className="mb-6 text-sm text-stone-500">D → C → B の順で入力してください。A（有償）は自動計算されます。合計が100%になるよう割り振ってください。</p>
            <div className="space-y-4">
              {[
                { key: "future_D", label: "D. 学習", max: 50, hint: "10年後、どんなことを学んでいたいですか？" },
                { key: "future_C", label: "C. ギフト", max: 40, hint: "社会や誰かのために、何かしていたいことはありますか？" },
                { key: "future_B", label: "B. 家事", max: 40, hint: "家庭での役割は、10年後どう変わっていると思いますか？" },
              ].map(({ key, label, max, hint }) => (
                <div key={key} className="flex items-center gap-4 rounded-lg border border-stone-200 p-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-stone-700">{label}（0〜{max}%）</p>
                    <p className="text-xs text-stone-400">{hint}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={max}
                      value={future[key as keyof Step3Data] ?? 0}
                      onChange={(e) => {
                        const v = Math.max(0, Math.min(max, parseInt(e.target.value, 10) || 0));
                        setFuture((f) => ({ ...f, [key]: v }));
                      }}
                      className="w-16 rounded-lg border border-stone-300 px-2 py-2 text-center text-lg font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-community"
                    />
                    <span className="text-stone-500">%</span>
                  </div>
                </div>
              ))}

              {/* A. 有償（自動計算） */}
              <div className={`flex items-center gap-4 rounded-lg p-4 ${inputA < 0 ? "bg-red-50 border border-red-200" : "bg-stone-100 border border-stone-200"}`}>
                <div className="flex-1">
                  <p className="text-sm font-medium text-stone-700">A. 有償（自動計算）</p>
                  <p className="text-xs text-stone-400">100 − D − C − B</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-lg font-bold ${inputA < 0 ? "text-red-600" : "text-stone-800"}`}>
                    {inputA}
                  </span>
                  <span className="text-stone-500">%</span>
                </div>
              </div>
            </div>

            {inputA < 0 && (
              <p className="mt-3 text-sm text-red-600">⚠️ 合計が100%を超えています。D・C・Bの値を減らしてください。</p>
            )}
            {error && <p className="mt-4 text-sm text-red-600" role="alert">{error}</p>}
            <div className="mt-8 flex justify-end gap-3">
              <button type="button" onClick={() => setStep("intro")} className="rounded-xl border border-stone-300 px-4 py-2 text-stone-600">戻る</button>
              <button
                type="button"
                onClick={handleToCompare}
                disabled={inputA < 0}
                className="rounded-xl bg-community px-6 py-2 text-white disabled:opacity-40"
              >
                比較を見る
              </button>
            </div>
          </section>
          );
        })()}

        {/* 3-C: 2画面比較 */}
        {step === "compare" && (
          <section className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-lg font-bold text-stone-800">現在 vs 10年後</h2>
            <div className="grid grid-cols-2 gap-4">
              {/* 現在 */}
              <div className="rounded-xl border border-stone-200 p-4">
                <p className="mb-4 text-center text-sm font-semibold text-stone-500">現在（As-Is）</p>
                <div className="space-y-3">
                  {WORKS.map((w) => {
                    const pct = currentPct[w.id as keyof typeof currentPct];
                    return (
                      <div key={w.id}>
                        <div className="mb-1 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: w.color }} />
                            <span className="text-xs text-stone-600">{w.label}</span>
                          </div>
                          <span className="text-sm font-bold text-stone-700">{pct}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: w.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 10年後 */}
              <div className="rounded-xl border border-community/40 bg-green-50/40 p-4">
                <p className="mb-4 text-center text-sm font-semibold text-community">10年後（To-Be）</p>
                <div className="space-y-3">
                  {WORKS.map((w) => {
                    const pct = futurePct[w.id as keyof typeof futurePct];
                    return (
                      <div key={w.id}>
                        <div className="mb-1 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: w.color }} />
                            <span className="text-xs text-stone-600">{w.label}</span>
                          </div>
                          <span className="text-sm font-bold text-community">{pct}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: w.color }} />
                        </div>
                      </div>
                    );
                  })}
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

            {/* 差分テーブル */}
            <div className="mb-8 overflow-hidden rounded-xl border border-stone-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-stone-50 text-stone-500">
                    <th className="px-4 py-2 text-left font-medium">分野</th>
                    <th className="px-4 py-2 text-center font-medium">現在</th>
                    <th className="px-4 py-2 text-center font-medium">10年後</th>
                    <th className="px-4 py-2 text-center font-medium">変化</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {WORKS.map((w) => {
                    const cur = currentPct[w.id as keyof typeof currentPct];
                    const fut = futurePct[w.id as keyof typeof futurePct];
                    const diff = fut - cur;
                    return (
                      <tr key={w.id} className="bg-white">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: w.color }} />
                            <span className="font-medium text-stone-700">{w.label}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-stone-600">{cur}%</td>
                        <td className="px-4 py-3 text-center font-bold text-stone-800">{fut}%</td>
                        <td className="px-4 py-3 text-center">
                          {diff === 0 ? (
                            <span className="text-stone-400">−</span>
                          ) : diff > 0 ? (
                            <span className="font-bold text-emerald-600">▲ +{diff}%</span>
                          ) : (
                            <span className="font-bold text-rose-500">▼ {diff}%</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

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
