"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const CATEGORIES = [
  { key: "paid_work_hours", label: "本業・関連" },
  { key: "home_work_hours", label: "生活維持" },
  { key: "care_hours", label: "ケア・付き合い" },
  { key: "study_hours", label: "自己投資" },
  { key: "leisure_hours", label: "娯楽・休息" },
  { key: "other_hours", label: "その他" },
] as const;

const WORKS = [
  { id: "A", label: "A. 有償（Paid Work）", color: "#1a6b3a" },
  { id: "B", label: "B. 家事（Home Work）", color: "#2e9e5b" },
  { id: "C", label: "C. ギフト（Gift Work）", color: "#52c47a" },
  { id: "D", label: "D. 学習（Study Work）", color: "#86efac" },
] as const;

type AllocationRow = { A: number; B: number; C: number; D: number };
type Step1Data = Record<string, number>;
type Allocation = Partial<Record<(typeof CATEGORIES)[number]["key"], AllocationRow>>;

const defaultAllocation = (): Allocation => ({
  paid_work_hours: { A: 100, B: 0, C: 0, D: 0 },
  home_work_hours: { A: 0, B: 100, C: 0, D: 0 },
  care_hours: { A: 0, B: 80, C: 20, D: 0 },
  study_hours: { A: 0, B: 0, C: 0, D: 100 },
  leisure_hours: { A: 0, B: 0, C: 20, D: 80 },
  other_hours: { A: 0, B: 50, C: 0, D: 50 },
});

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

export default function Block2Page() {
  const [step, setStep] = useState<"intro" | "allocation" | "chart" | "comment">("intro");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step1, setStep1] = useState<Step1Data>({});
  const [allocation, setAllocation] = useState<Allocation>(defaultAllocation());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/workshop/me", { credentials: "include" });
      if (res.status === 401) {
        window.location.href = "/login?from=/workshop/block-2";
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
        const alloc: Allocation = {};
        for (const { key } of CATEGORIES) {
          const row = w.step2.allocation[key];
          if (row && typeof row === "object")
            alloc[key] = normalizeRow(row as AllocationRow);
        }
        if (Object.keys(alloc).length > 0) setAllocation((prev) => ({ ...defaultAllocation(), ...alloc }));
      }
      setLoading(false);
    })();
  }, []);

  const workHours = useMemo(() => {
    const hours: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
    let step1Total = 0;
    for (const { key } of CATEGORIES) {
      const h = Number(step1[key]) || 0;
      step1Total += h;
      const row = normalizeRow(allocation[key]);
      hours.A += (h * (row.A || 0)) / 100;
      hours.B += (h * (row.B || 0)) / 100;
      hours.C += (h * (row.C || 0)) / 100;
      hours.D += (h * (row.D || 0)) / 100;
    }
    const sum = hours.A + hours.B + hours.C + hours.D;
    if (sum === 0) return { hours: { A: 0, B: 0, C: 0, D: 0 }, total: step1Total };
    return { hours, total: step1Total };
  }, [step1, allocation]);

  const pieData = useMemo(() => {
    const { hours, total } = workHours;
    if (total === 0)
      return WORKS.map((w) => ({ name: w.label, value: 25, hours: 0 }));
    return WORKS.map((w) => ({
      name: w.label,
      value: total ? Math.round((hours[w.id as keyof typeof hours] / total) * 100) : 0,
      hours: Math.round(hours[w.id as keyof typeof hours] * 10) / 10,
    }));
  }, [workHours]);

  const setCategoryAllocation = (key: (typeof CATEGORIES)[number]["key"], row: AllocationRow) => {
    setAllocation((prev) => ({ ...prev, [key]: normalizeRow(row) }));
  };

  const saveStep2 = async () => {
    setSaving(true);
    setError(null);
    const alloc: Record<string, AllocationRow> = {};
    for (const { key } of CATEGORIES) {
      alloc[key] = normalizeRow(allocation[key]);
    }
    const res = await fetch("/api/workshop/me/step2", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ allocation: alloc }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "保存に失敗しました。");
      return false;
    }
    return true;
  };

  const handleToAllocation = () => setStep("allocation");
  const handleToChart = async () => {
    const ok = await saveStep2();
    if (ok) setStep("chart");
  };
  const handleToComment = () => setStep("comment");
  const handleToBlock3 = () => {
    window.location.href = "/workshop/block-3";
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
          <Link href="/workshop/block-1" className="text-community hover:underline">
            ← Block 1
          </Link>
          {" · "}
          STEP 2：4つのワークへの仕分け
        </p>

        {/* 2-A: 4ワーク説明 */}
        {step === "intro" && (
          <section className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
            <div className="mb-6 flex justify-center">
              <div className="h-24 w-24 rounded-full bg-community-light opacity-90" aria-hidden />
            </div>
            <h1 className="mb-4 text-center text-xl font-bold text-stone-800">ミッチー</h1>
            <p className="mb-6 leading-relaxed text-stone-700">
              では、先ほどの時間を4つの箱に入れていきましょう。ハンディの4つのワークです。
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {WORKS.map((w) => (
                <div
                  key={w.id}
                  className="rounded-xl border border-stone-200 p-4"
                  style={{ borderLeftWidth: 4, borderLeftColor: w.color }}
                >
                  <span className="font-medium text-stone-800">{w.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={handleToAllocation}
                className="rounded-xl bg-community px-6 py-3 text-white transition hover:bg-community-light"
              >
                仕分けを始める
              </button>
            </div>
          </section>
        )}

        {/* 2-B: 仕分けUI */}
        {step === "allocation" && (
          <section className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
            <h2 className="mb-2 text-lg font-bold text-stone-800">各カテゴリを4ワークに振り分け</h2>
            <p className="mb-6 text-sm text-stone-500">
              スライダーで比率（%）を設定。合計100%になります。一つのカテゴリを複数ワークに分散してもOKです。
            </p>
            <div className="space-y-6">
              {CATEGORIES.map(({ key, label }) => {
                const row = normalizeRow(allocation[key]);
                const update = (k: "A" | "B" | "C" | "D", v: number) => {
                  const next = { ...row, [k]: Math.max(0, Math.min(100, v)) };
                  const sum = next.A + next.B + next.C + next.D;
                  if (sum !== 100) {
                    const scale = 100 / sum;
                    next.A = Math.round(next.A * scale);
                    next.B = Math.round(next.B * scale);
                    next.C = Math.round(next.C * scale);
                    next.D = 100 - next.A - next.B - next.C;
                  }
                  setCategoryAllocation(key, next);
                };
                return (
                  <div key={key} className="rounded-lg border border-stone-100 bg-stone-50/50 p-4">
                    <p className="mb-3 text-sm font-medium text-stone-700">{label}</p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {(["A", "B", "C", "D"] as const).map((k) => (
                        <div key={k}>
                          <label className="mb-1 block text-xs text-stone-500">
                            {WORKS.find((w) => w.id === k)?.label.split(".")[0]}. {k}
                          </label>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={row[k]}
                            onChange={(e) => update(k, parseInt(e.target.value, 10))}
                            className="w-full"
                          />
                          <span className="text-sm font-medium text-stone-700">{row[k]}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            {error && (
              <p className="mt-4 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setStep("intro")}
                className="rounded-xl border border-stone-300 px-4 py-2 text-stone-600"
              >
                戻る
              </button>
              <button
                type="button"
                onClick={handleToChart}
                disabled={saving}
                className="rounded-xl bg-community px-6 py-2 text-white disabled:opacity-60"
              >
                {saving ? "保存中..." : "保存して円グラフを見る"}
              </button>
            </div>
          </section>
        )}

        {/* 2-C: 円グラフ */}
        {step === "chart" && (
          <section className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-stone-800">現在のポートフォリオ</h2>
            <div className="mx-auto h-72 w-full max-w-sm">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius="80%"
                    label={({ name, payload }: { name?: string; payload?: { hours?: number } }) =>
                      `${(name ?? "").split(".")[0]} ${payload?.hours ?? 0}h`}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={WORKS[i]?.color ?? "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name, item) => {
                      const hours = (item?.payload as { hours?: number } | undefined)?.hours ?? 0;
                      return [`${hours} 時間（${value ?? 0}%）`, name];
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-4 space-y-1 text-sm text-stone-600">
              {pieData.map((d) => (
                <li key={d.name}>
                  {d.name}: {d.hours} 時間（{d.value}%）
                </li>
              ))}
            </ul>
            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setStep("allocation")}
                className="rounded-xl border border-stone-300 px-4 py-2 text-stone-600"
              >
                仕分けを修正
              </button>
              <button
                type="button"
                onClick={handleToComment}
                className="rounded-xl bg-community px-6 py-2 text-white"
              >
                次へ
              </button>
            </div>
          </section>
        )}

        {/* 2-D: ミッチーコメント */}
        {step === "comment" && (
          <section className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
            <div className="mb-6 flex justify-center">
              <div className="h-24 w-24 rounded-full bg-community-light opacity-90" aria-hidden />
            </div>
            <h2 className="mb-4 text-lg font-bold text-stone-800">ミッチーからのコメント</h2>
            <p className="mb-6 leading-relaxed text-stone-700">
              {(() => {
                const min = pieData.reduce((acc, d) => (d.value < acc.value ? d : acc), pieData[0]);
                return `あなたのポートフォリオでは、${min?.name ?? "学習"}が全体の${min?.value ?? 0}%です。これは多いですか、少ないですか？ 次のSTEPでは、10年後の理想の時間配分を一緒に設計していきましょう。`;
              })()}
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleToBlock3}
                className="rounded-xl bg-community px-6 py-3 text-white transition hover:bg-community-light"
              >
                STEP 3 へ進む
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
