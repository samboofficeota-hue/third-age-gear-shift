"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

const WORKS = [
  { id: "A", label: "A. 有償",   color: "#78716C" },  // stone
  { id: "B", label: "B. 家事",   color: "#3B82F6" },  // blue
  { id: "C", label: "C. ギフト", color: "#2E9E5B" },  // green
  { id: "D", label: "D. 学習",   color: "#F97316" },  // orange
] as const;

const PHASE_COLORS = ["#2E9E5B", "#3B82F6", "#F97316"];

type Phase = {
  phase_number: 1 | 2 | 3;
  name: string;
  duration_months: number;
  increase_work: string[];
  decrease_work: string[];
  key_actions: string[];
  success_definition: string;
};

const defaultPhase = (n: 1 | 2 | 3): Phase => ({
  phase_number: n,
  name: n === 1 ? "種まき期" : n === 2 ? "成長期" : "展開期",
  duration_months: 18,
  increase_work: [],
  decrease_work: [],
  key_actions: ["", "", ""],
  success_definition: "",
});

export default function Block7Page() {
  const [step, setStep] = useState<"intro" | "phases" | "final">("intro");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phases, setPhases] = useState<Phase[]>([
    defaultPhase(1),
    defaultPhase(2),
    defaultPhase(3),
  ]);
  const [firstStep, setFirstStep] = useState("");
  const [activePhase, setActivePhase] = useState(0);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/workshop/me", { credentials: "include" });
      if (res.status === 401) {
        window.location.href = "/login?from=/workshop/block-7";
        return;
      }
      const json = await res.json();
      const w = json.workshopData;
      if (w?.step7 && typeof w.step7 === "object") {
        const s = w.step7 as { phases?: Phase[]; first_step?: string };
        if (Array.isArray(s.phases) && s.phases.length === 3) {
          setPhases(s.phases as Phase[]);
        }
        setFirstStep(s.first_step ?? "");
      }
      setLoading(false);
    })();
  }, []);

  const totalMonths = useMemo(() => phases.reduce((s, p) => s + p.duration_months, 0), [phases]);

  const save = async () => {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/workshop/me/step7", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phases, first_step: firstStep }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d?.error ?? "保存に失敗しました。");
      return false;
    }
    return true;
  };

  const handlePhasesNext = async () => {
    const ok = await save();
    if (ok) setStep("final");
  };

  const handleFinish = async () => {
    const ok = await save();
    if (ok) window.location.href = "/workshop/block-8";
  };

  const updatePhase = (index: number, update: Partial<Phase>) => {
    setPhases((ps) => ps.map((p, i) => (i === index ? { ...p, ...update } : p)));
  };

  const toggleWork = (phaseIndex: number, field: "increase_work" | "decrease_work", workId: string) => {
    const arr = phases[phaseIndex][field];
    const next = arr.includes(workId) ? arr.filter((x) => x !== workId) : [...arr, workId];
    updatePhase(phaseIndex, { [field]: next });
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
          <Link href="/workshop/block-6" className="text-community hover:underline">
            ← Block 6
          </Link>
          {" · "}
          STEP 7：5年間の移行計画
        </p>

        {/* 7-A: 導入 */}
        {step === "intro" && (
          <section className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
            <p className="mb-4 leading-relaxed text-stone-700">
              いよいよ最後のステップです。
            </p>
            <p className="mb-6 leading-relaxed text-stone-700">
              あなたには、これから<strong>30,000時間</strong>の移行原資があります。
              この時間をどう使うか、5年間（60ヶ月）の計画を3つのPhaseに分けて設計しましょう。
            </p>
            <div className="mb-6 rounded-xl bg-stone-50 p-4">
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((n, i) => (
                  <div key={n} className="flex items-center gap-2">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: PHASE_COLORS[i] }}
                    >
                      {n}
                    </div>
                    <span className="text-sm text-stone-600">{["種まき期", "成長期", "展開期"][i]}</span>
                    {n < 3 && <span className="text-stone-300">→</span>}
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-stone-400">合計60ヶ月（5年間）になるよう設計します</p>
            </div>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setStep("phases")}
                className="rounded-xl bg-community px-6 py-3 text-white transition hover:bg-community-light"
              >
                計画を立てる
              </button>
            </div>
          </section>
        )}

        {/* 7-B: Phase設計 */}
        {step === "phases" && (
          <section className="space-y-4">
            {/* タイムライン */}
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <p className="mb-2 text-sm font-medium text-stone-600">タイムライン（合計 {totalMonths} ヶ月 / 60ヶ月）</p>
              <div className="flex h-8 overflow-hidden rounded-lg">
                {phases.map((p, i) => (
                  <div
                    key={p.phase_number}
                    className="flex items-center justify-center text-xs font-bold text-white transition-all"
                    style={{
                      width: `${(p.duration_months / 60) * 100}%`,
                      backgroundColor: PHASE_COLORS[i],
                      minWidth: "2rem",
                    }}
                  >
                    P{p.phase_number}
                  </div>
                ))}
                {totalMonths < 60 && (
                  <div
                    className="flex items-center justify-center bg-stone-100 text-xs text-stone-400"
                    style={{ width: `${((60 - totalMonths) / 60) * 100}%` }}
                  >
                    残{60 - totalMonths}ヶ月
                  </div>
                )}
              </div>
              {totalMonths > 60 && (
                <p className="mt-1 text-xs text-rose-600">⚠️ 合計が60ヶ月を超えています（現在 {totalMonths} ヶ月）</p>
              )}
            </div>

            {/* Phase タブ */}
            <div className="flex gap-2">
              {phases.map((p, i) => (
                <button
                  key={p.phase_number}
                  type="button"
                  onClick={() => setActivePhase(i)}
                  className={`flex-1 rounded-xl py-2 text-sm font-bold transition ${
                    activePhase === i ? "text-white" : "bg-white text-stone-500 border border-stone-200"
                  }`}
                  style={activePhase === i ? { backgroundColor: PHASE_COLORS[i] } : {}}
                >
                  Phase {p.phase_number}
                </button>
              ))}
            </div>

            {/* 選択中のPhase入力 */}
            {phases.map((p, i) => (
              <div key={p.phase_number} className={activePhase === i ? "block" : "hidden"}>
                <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
                  <div
                    className="mb-4 h-1 w-12 rounded-full"
                    style={{ backgroundColor: PHASE_COLORS[i] }}
                  />
                  <div className="space-y-5">
                    {/* Phaseの名前 */}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-stone-700">
                        Phase {p.phase_number} の名前
                      </label>
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => updatePhase(i, { name: e.target.value })}
                        className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                        placeholder="例：種まき期、準備期、旅立ち期..."
                      />
                    </div>

                    {/* 期間 */}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-stone-700">
                        期間：<strong>{p.duration_months} ヶ月</strong>
                      </label>
                      <input
                        type="range"
                        min={3}
                        max={54}
                        step={3}
                        value={p.duration_months}
                        onChange={(e) => updatePhase(i, { duration_months: Number(e.target.value) })}
                        className="w-full accent-community"
                      />
                      <div className="flex justify-between text-xs text-stone-400">
                        <span>3ヶ月</span><span>54ヶ月</span>
                      </div>
                    </div>

                    {/* 増やすワーク */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-stone-700">
                        このPhaseで増やすワーク
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {WORKS.map((w) => (
                          <button
                            key={w.id}
                            type="button"
                            onClick={() => toggleWork(i, "increase_work", w.id)}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                              p.increase_work.includes(w.id)
                                ? "text-white"
                                : "bg-stone-100 text-stone-500"
                            }`}
                            style={p.increase_work.includes(w.id) ? { backgroundColor: w.color } : {}}
                          >
                            {w.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 減らすワーク */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-stone-700">
                        このPhaseで減らすワーク
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {WORKS.map((w) => (
                          <button
                            key={w.id}
                            type="button"
                            onClick={() => toggleWork(i, "decrease_work", w.id)}
                            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                              p.decrease_work.includes(w.id)
                                ? "border-rose-400 bg-rose-50 text-rose-600"
                                : "border-stone-200 bg-white text-stone-500"
                            }`}
                          >
                            {w.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 最重要アクション */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-stone-700">
                        最重要アクション（3つまで）
                      </label>
                      <div className="space-y-2">
                        {[0, 1, 2].map((j) => (
                          <div key={j} className="flex items-center gap-2">
                            <span className="w-5 text-center text-xs font-bold text-stone-400">{j + 1}</span>
                            <input
                              type="text"
                              value={p.key_actions[j] ?? ""}
                              onChange={(e) => {
                                const actions = [...p.key_actions];
                                actions[j] = e.target.value;
                                updatePhase(i, { key_actions: actions });
                              }}
                              className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm"
                              placeholder={`アクション ${j + 1}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 成功の定義 */}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-stone-700">
                        このPhaseの成功の定義
                      </label>
                      <textarea
                        rows={2}
                        value={p.success_definition}
                        onChange={(e) => updatePhase(i, { success_definition: e.target.value })}
                        className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                        placeholder="どうなったらこのPhaseが成功といえますか？"
                      />
                    </div>
                  </div>
                </div>

                {/* Phase切り替えボタン */}
                <div className="flex justify-between">
                  {i > 0 ? (
                    <button type="button" onClick={() => setActivePhase(i - 1)} className="rounded-xl border border-stone-300 px-4 py-2 text-sm text-stone-600">
                      ← Phase {p.phase_number - 1}
                    </button>
                  ) : <div />}
                  {i < 2 ? (
                    <button type="button" onClick={() => setActivePhase(i + 1)} className="rounded-xl border border-stone-300 px-4 py-2 text-sm text-stone-600">
                      Phase {p.phase_number + 1} →
                    </button>
                  ) : <div />}
                </div>
              </div>
            ))}

            {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setStep("intro")} className="rounded-xl border border-stone-300 px-4 py-2 text-stone-600">
                戻る
              </button>
              <button
                type="button"
                onClick={handlePhasesNext}
                disabled={saving || totalMonths > 60}
                className="rounded-xl bg-community px-6 py-2 text-white disabled:opacity-40"
              >
                {saving ? "保存中..." : "完成させる"}
              </button>
            </div>
          </section>
        )}

        {/* 7-D: 最終コメント + 第一歩 */}
        {step === "final" && (
          <section className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-lg font-bold text-stone-800">移行計画の完成</h2>

            {/* Phase サマリー */}
            <div className="mb-6 space-y-3">
              {phases.map((p, i) => (
                <div key={p.phase_number} className="flex items-start gap-3 rounded-xl border border-stone-200 p-4">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: PHASE_COLORS[i] }}
                  >
                    {p.phase_number}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-stone-800">{p.name}</p>
                    <p className="text-xs text-stone-500">{p.duration_months} ヶ月</p>
                    {p.key_actions.filter(Boolean).length > 0 && (
                      <ul className="mt-1 space-y-0.5">
                        {p.key_actions.filter(Boolean).map((a, j) => (
                          <li key={j} className="text-xs text-stone-600">• {a}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-6 rounded-xl border border-community/30 bg-green-50/40 p-5">
              <p className="leading-relaxed text-stone-700">
                移行計画が完成しました。{phases[0].name}・{phases[1].name}・{phases[2].name}という3つのPhaseで、着実に理想のポートフォリオへ近づいていけます。
              </p>
              <p className="mt-2 leading-relaxed text-stone-700">
                最後にひとつ教えてください——
              </p>
            </div>

            <div className="mb-6">
              <label className="mb-1 block text-sm font-medium text-stone-700">
                Phase 1 の最初の一歩として、<strong>明日からできること</strong>は何ですか？
              </label>
              <textarea
                rows={3}
                value={firstStep}
                onChange={(e) => setFirstStep(e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2"
                placeholder="小さくてもOKです。明日の自分が実際にできることを書いてください。"
              />
            </div>

            {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setStep("phases")} className="rounded-xl border border-stone-300 px-4 py-2 text-stone-600">
                戻る
              </button>
              <button
                type="button"
                onClick={handleFinish}
                disabled={saving}
                className="rounded-xl bg-community px-6 py-3 text-white transition hover:bg-community-light disabled:opacity-60"
              >
                {saving ? "保存中..." : "経営計画書を作成する"}
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
