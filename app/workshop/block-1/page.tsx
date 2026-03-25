"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { WORK_TYPES, type WorkType } from "@/lib/workTypes";
import type { MergeSuggestion } from "@/app/api/workshop/me/step1/merge/route";

type ActivityRow = { id: string; description: string; hours: string; workType: WorkType | null };
type MonthlyRow = {
  id: string;
  description: string;
  source: "weekday" | "weekend" | "extra";
  perLabel: string;   // 表示用：「平日 Xh/日」など
  monthlyHours: string;
  workType: WorkType | null;
};
type Step = "intro" | "weekday" | "weekend" | "monthly";


function newRow(): ActivityRow {
  return { id: crypto.randomUUID(), description: "", hours: "", workType: null };
}

function newMonthlyRow(): MonthlyRow {
  return {
    id: crypto.randomUUID(),
    description: "",
    source: "extra",
    perLabel: "",
    monthlyHours: "",
    workType: null,
  };
}

/** 平日×22日 + 週末×8日（土日4週）＝ 月480h へ変換 */
function buildMonthly(
  weekday: ActivityRow[],
  weekend: ActivityRow[]
): MonthlyRow[] {
  const rows: MonthlyRow[] = [];
  for (const r of weekday) {
    const h = parseFloat(r.hours) || 0;
    if (!r.description.trim() && h === 0) continue;
    rows.push({
      id: r.id + "_wd",
      description: r.description,
      source: "weekday",
      perLabel: `平日 ${h}h/日`,
      monthlyHours: String(Math.round(h * 22 * 10) / 10),
      workType: r.workType,
    });
  }
  for (const r of weekend) {
    const h = parseFloat(r.hours) || 0;
    if (!r.description.trim() && h === 0) continue;
    rows.push({
      id: r.id + "_we",
      description: r.description,
      source: "weekend",
      perLabel: `週末 ${h}h/日`,
      monthlyHours: String(Math.round(h * 8 * 10) / 10),
      workType: r.workType,
    });
  }
  return rows;
}

/** ワーク区分の並び順 */
const WORK_ORDER: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, E: 4 };

/** 月間行をワーク区分順にソート（A→B→C→D→E→未分類） */
function sortByWorkType(rows: MonthlyRow[]): MonthlyRow[] {
  return [...rows].sort((a, b) => {
    const ao = WORK_ORDER[a.workType ?? ""] ?? 5;
    const bo = WORK_ORDER[b.workType ?? ""] ?? 5;
    return ao - bo;
  });
}

/** 合計時間のカラー */
function totalColor(total: number, target: number) {
  if (total >= target * 0.95 && total <= target * 1.05) return "text-[#00ff88]";
  if (total > target * 1.05) return "text-amber-400";
  return "text-[#e0f0e8]";
}

export default function Block1Page() {
  const [step, setStep] = useState<Step>("intro");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [merging, setMerging] = useState(false);
  const [mergeError, setMergeError] = useState<string | null>(null);
  const [mergeSuggestions, setMergeSuggestions] = useState<MergeSuggestion[] | null>(null);
  const [selectedMerges, setSelectedMerges] = useState<Set<number>>(new Set());

  const [weekdayRows, setWeekdayRows] = useState<ActivityRow[]>([
    { id: crypto.randomUUID(), description: "仕事", hours: "", workType: "A" },
    { id: crypto.randomUUID(), description: "通勤", hours: "", workType: "E" },
    { id: crypto.randomUUID(), description: "睡眠", hours: "", workType: "E" },
    { id: crypto.randomUUID(), description: "家事", hours: "", workType: "B" },
    { id: crypto.randomUUID(), description: "SNS", hours: "", workType: "E" },
  ]);
  const [weekendRows, setWeekendRows] = useState<ActivityRow[]>([
    { id: crypto.randomUUID(), description: "お掃除", hours: "", workType: "B" },
    { id: crypto.randomUUID(), description: "お買い物", hours: "", workType: "B" },
    { id: crypto.randomUUID(), description: "お外でディナー", hours: "", workType: "B" },
    { id: crypto.randomUUID(), description: "読書", hours: "", workType: "D" },
    { id: crypto.randomUUID(), description: "睡眠", hours: "", workType: "E" },
  ]);
  const [monthlyRows, setMonthlyRows] = useState<MonthlyRow[]>([]);

  // 既存データの復元
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/workshop/me", { credentials: "include" });
      if (res.status === 401) {
        window.location.href = "/login?from=/workshop/block-1";
        return;
      }
      const data = await res.json();
      const s1 = data.workshopData?.step1;
      if (s1) {
        const defaultWeekday: ActivityRow[] = [
          { id: crypto.randomUUID(), description: "仕事", hours: "", workType: "A" },
          { id: crypto.randomUUID(), description: "通勤", hours: "", workType: "E" },
          { id: crypto.randomUUID(), description: "睡眠", hours: "", workType: "E" },
          { id: crypto.randomUUID(), description: "家事", hours: "", workType: "B" },
          { id: crypto.randomUUID(), description: "SNS", hours: "", workType: "E" },
        ];
        const toRows = (arr: unknown, fallback: ActivityRow[]): ActivityRow[] =>
          Array.isArray(arr) && arr.length > 0
            ? arr.map((a: { description?: string; hours?: number; workType?: string }) => ({
                id: crypto.randomUUID(),
                description: a.description ?? "",
                hours: String(a.hours ?? ""),
                workType: (["A","B","C","D","E"].includes(a.workType ?? "") ? a.workType as WorkType : null),
              }))
            : fallback;

        const wd = toRows(s1.weekdayActivities, defaultWeekday);
        const defaultWeekend: ActivityRow[] = [
          { id: crypto.randomUUID(), description: "お掃除", hours: "", workType: "B" },
          { id: crypto.randomUUID(), description: "お買い物", hours: "", workType: "B" },
          { id: crypto.randomUUID(), description: "お外でディナー", hours: "", workType: "B" },
          { id: crypto.randomUUID(), description: "読書", hours: "", workType: "D" },
          { id: crypto.randomUUID(), description: "睡眠", hours: "", workType: "E" },
        ];
        const we = toRows(s1.weekendActivities, defaultWeekend);
        setWeekdayRows(wd);
        setWeekendRows(we);

        // monthlyExtras + computed を復元
        const computed = buildMonthly(wd, we);
        const extras: MonthlyRow[] = Array.isArray(s1.monthlyExtras)
          ? s1.monthlyExtras.map((a: { description?: string; hours?: number; workType?: string }) => ({
              id: crypto.randomUUID(),
              description: a.description ?? "",
              source: "extra" as const,
              perLabel: "",
              monthlyHours: String(a.hours ?? ""),
              workType: (["A","B","C","D","E"].includes(a.workType ?? "") ? a.workType as WorkType : null),
            }))
          : [];
        setMonthlyRows(sortByWorkType([...computed, ...extras]));
      }
      setLoading(false);
    })();
  }, []);

  // ─── 平日フォーム操作 ───
  const addWeekdayRow = () => setWeekdayRows((p) => [...p, newRow()]);
  const removeWeekdayRow = (id: string) =>
    setWeekdayRows((p) => (p.length > 1 ? p.filter((r) => r.id !== id) : p));
  const updateWeekdayRow = (id: string, f: "description" | "hours", v: string) =>
    setWeekdayRows((p) => p.map((r) => (r.id === id ? { ...r, [f]: v } : r)));
  const updateWeekdayWorkType = (id: string, wt: WorkType) =>
    setWeekdayRows((p) => p.map((r) => (r.id === id ? { ...r, workType: r.workType === wt ? null : wt } : r)));

  // ─── 週末フォーム操作 ───
  const addWeekendRow = () => setWeekendRows((p) => [...p, newRow()]);
  const removeWeekendRow = (id: string) =>
    setWeekendRows((p) => (p.length > 1 ? p.filter((r) => r.id !== id) : p));
  const updateWeekendRow = (id: string, f: "description" | "hours", v: string) =>
    setWeekendRows((p) => p.map((r) => (r.id === id ? { ...r, [f]: v } : r)));
  const updateWeekendWorkType = (id: string, wt: WorkType) =>
    setWeekendRows((p) => p.map((r) => (r.id === id ? { ...r, workType: r.workType === wt ? null : wt } : r)));

  // ─── 月間フォーム操作 ───
  const updateMonthlyHours = (id: string, v: string) =>
    setMonthlyRows((p) =>
      p.map((r) => (r.id === id ? { ...r, monthlyHours: v } : r))
    );
  const addMonthlyExtra = () =>
    setMonthlyRows((p) => [...p, newMonthlyRow()]);
  const updateMonthlyExtra = (
    id: string,
    f: "description" | "monthlyHours",
    v: string
  ) =>
    setMonthlyRows((p) => p.map((r) => (r.id === id ? { ...r, [f]: v } : r)));
  const removeMonthlyRow = (id: string) =>
    setMonthlyRows((p) => p.filter((r) => r.id !== id));
  const updateMonthlyWorkType = (id: string, wt: WorkType) =>
    setMonthlyRows((p) =>
      p.map((r) => (r.id === id ? { ...r, workType: r.workType === wt ? null : wt } : r))
    );

  // ─── 合計 ───
  const weekdayTotal = useMemo(
    () => weekdayRows.reduce((s, r) => s + (parseFloat(r.hours) || 0), 0),
    [weekdayRows]
  );
  const weekendTotal = useMemo(
    () => weekendRows.reduce((s, r) => s + (parseFloat(r.hours) || 0), 0),
    [weekendRows]
  );
  const monthlyTotal = useMemo(
    () => monthlyRows.reduce((s, r) => s + (parseFloat(r.monthlyHours) || 0), 0),
    [monthlyRows]
  );

  // ─── 週末 → 月間ステップ移動 ───
  const goToMonthly = () => {
    const computed = buildMonthly(weekdayRows, weekendRows);
    const existingExtras = monthlyRows.filter((r) => r.source === "extra");
    setMonthlyRows(sortByWorkType([...computed, ...existingExtras]));
    setStep("monthly");
  };

  // ─── 統合候補を取得 ───
  const handleRequestMerge = async () => {
    setMerging(true);
    setMergeError(null);
    setMergeSuggestions(null);

    const activities = monthlyRows
      .filter((r) => r.description.trim() || parseFloat(r.monthlyHours) > 0)
      .map((r) => ({
        id: r.id,
        description: r.description,
        hours: parseFloat(r.monthlyHours) || 0,
        workType: r.workType,
      }));

    const res = await fetch("/api/workshop/me/step1/merge", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activities }),
    });

    setMerging(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setMergeError(d?.error ?? "統合処理に失敗しました。");
      return;
    }
    const data = await res.json();
    const suggestions: MergeSuggestion[] = data.suggestions ?? [];

    // 統合候補（2件以上）のインデックスをデフォルト選択
    const defaultSelected = new Set(
      suggestions
        .map((s, i) => (s.ids.length > 1 ? i : -1))
        .filter((i) => i >= 0)
    );
    setSelectedMerges(defaultSelected);
    setMergeSuggestions(suggestions);
  };

  // ─── 統合を適用 ───
  const applyMerges = () => {
    if (!mergeSuggestions) return;

    const removedIds = new Set<string>();
    const mergedRows: MonthlyRow[] = [];

    for (let i = 0; i < mergeSuggestions.length; i++) {
      const s = mergeSuggestions[i];
      if (selectedMerges.has(i) && s.ids.length > 1) {
        s.ids.forEach((id) => removedIds.add(id));
        const members = s.ids
          .map((id) => monthlyRows.find((r) => r.id === id))
          .filter((r): r is MonthlyRow => !!r);
        const perLabels = Array.from(new Set(members.map((r) => r.perLabel).filter(Boolean)));
        mergedRows.push({
          id: crypto.randomUUID(),
          description: s.mergedName,
          source: members[0]?.source ?? "extra",
          perLabel: perLabels.join("・"),
          monthlyHours: String(s.totalHours),
          workType: (s.workType as WorkType) ?? members[0]?.workType ?? null,
        });
      }
    }

    const keptRows = monthlyRows.filter((r) => !removedIds.has(r.id));
    setMonthlyRows(sortByWorkType([...keptRows, ...mergedRows]));
    setMergeSuggestions(null);
  };

  // ─── 保存 ───
  const handleSave = async () => {
    setSaving(true);
    setError(null);

    const weekdayActivities = weekdayRows
      .filter((r) => r.description.trim() || parseFloat(r.hours) > 0)
      .map((r) => ({ description: r.description.trim(), hours: parseFloat(r.hours) || 0, workType: r.workType }));

    const weekendActivities = weekendRows
      .filter((r) => r.description.trim() || parseFloat(r.hours) > 0)
      .map((r) => ({ description: r.description.trim(), hours: parseFloat(r.hours) || 0, workType: r.workType }));

    const monthlyExtras = monthlyRows
      .filter((r) => r.source === "extra" && (r.description.trim() || parseFloat(r.monthlyHours) > 0))
      .map((r) => ({ description: r.description.trim(), hours: parseFloat(r.monthlyHours) || 0, workType: r.workType }));

    // step2以降が参照する activities = 月間合計
    const activities = monthlyRows
      .filter((r) => r.description.trim() || parseFloat(r.monthlyHours) > 0)
      .map((r) => ({ description: r.description.trim(), hours: parseFloat(r.monthlyHours) || 0 }));

    const res = await fetch("/api/workshop/me/step1", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activities, weekdayActivities, weekendActivities, monthlyExtras }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d?.error ?? "保存に失敗しました。");
      return;
    }
    window.location.href = "/workshop/block-2";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-[#708070]">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 md:px-8">
      <div className="mx-auto max-w-2xl">
        <p className="mb-4 text-sm text-[#708070]">
          <Link href="/workshop/block-0" className="text-[#00ff88] hover:underline">
            ← Block 0
          </Link>
          {" · "}
          DAY 1：「はたらく」ポートフォリオ
        </p>

        {/* ===== INTRO ===== */}
        {step === "intro" && (
          <section className="rounded-xl border border-[rgba(0,255,136,0.2)] bg-[#141a2a] p-8 shadow-sm">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#00ff88]">
              STEP 1 — 現状分析
            </p>
            <h1 className="mb-2 text-2xl font-black text-[#e0f0e8] text-glow-neon">
              月 500時間 をどうしてる？
            </h1>
            <p className="mb-6 text-base font-bold text-[#a0c0b0]">
              「はたらく」ポートフォリオの現状分析
            </p>
            <div className="space-y-4 leading-[1.7] text-[#a0c0b0]">
              <p>
                4つのWORKの配分がどうなっているか。それぞれどんな活動をしているのか。<br />
                日常の分析から始めていきます。
              </p>
              <div className="rounded-lg border border-[rgba(0,255,136,0.2)] bg-[#0f1420] px-5 py-4 text-sm">
                <p>1日24時間のうち、睡眠を除くと <strong className="text-[#e0f0e8]">1日 16時間</strong></p>
                <p className="mt-1">1ヶ月では、30日 × 16時間 ＝ <strong className="text-[#e0f0e8]">480時間</strong></p>
                <p className="mt-2 text-[#708070]">つまり、1ヶ月・500時間を今どのように使っているかを分析します。</p>
              </div>
              <p>
                まずは、昨日の24時間を思い出してみましょう。
              </p>
            </div>
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => setStep("weekday")}
                className="rounded-xl bg-[#00ff88] px-8 py-3 font-bold text-[#0a0e1a] transition hover:bg-[#00cc6a]"
              >
                昨日 24H
              </button>
            </div>
          </section>
        )}

        {/* ===== 平日：昨日の24時間 ===== */}
        {step === "weekday" && (
          <section className="rounded-xl border border-[rgba(0,255,136,0.2)] bg-[#141a2a] p-6 shadow-sm">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#00ff88]">1 / 3</p>
                <h2 className="mb-1 text-lg font-bold text-[#e0f0e8]">昨日の24時間を教えてください</h2>
                <p className="text-sm leading-[1.7] text-[#a0c0b0]">
                  睡眠、通勤、仕事、家事、育児、勉強、娯楽など。<br />
                  思い浮かぶ順に書き出してください。
                </p>
              </div>
              {/* デジタル時計 */}
              <div className={`shrink-0 rounded-lg border bg-[#0f1420] px-5 py-3 text-right shadow-neon ${
                weekdayTotal > 24
                  ? "border-red-500/50"
                  : weekdayTotal === 24
                  ? "border-[rgba(0,255,136,0.3)]"
                  : "border-[rgba(0,255,136,0.3)]"
              }`}>
                <div className="flex items-baseline justify-end gap-0.5 font-mono leading-none">
                  <span className={`text-5xl font-black tracking-tight text-glow-neon ${
                    weekdayTotal > 24 ? "text-red-400" : weekdayTotal === 24 ? "text-[#00ff88]" : "text-[#e0f0e8]"
                  }`}>
                    {String(Math.floor(weekdayTotal)).padStart(2, "0")}
                  </span>
                  <span className={`text-3xl font-black ${
                    weekdayTotal > 24 ? "text-red-400" : weekdayTotal === 24 ? "text-[#00ff88]" : "text-[#e0f0e8]"
                  }`}>:</span>
                  <span className={`text-5xl font-black tracking-tight text-glow-neon ${
                    weekdayTotal > 24 ? "text-red-400" : weekdayTotal === 24 ? "text-[#00ff88]" : "text-[#e0f0e8]"
                  }`}>
                    {weekdayTotal % 1 >= 0.5 ? "30" : "00"}
                  </span>
                </div>
                {weekdayTotal > 24 && (
                  <p className="mt-1 text-xs font-medium text-red-400">24時間に修正してください</p>
                )}
              </div>
            </div>

            <ActivityInputTable
              rows={weekdayRows}
              onUpdate={updateWeekdayRow}
              onAdd={addWeekdayRow}
              onRemove={removeWeekdayRow}
              onWorkType={updateWeekdayWorkType}
            />
            <WorkLegend />

            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={() => setStep("intro")}
                className="rounded-xl border border-[rgba(0,255,136,0.2)] px-4 py-2 text-[#a0c0b0] transition hover:bg-[#0f1420]"
              >
                戻る
              </button>
              <button
                type="button"
                onClick={() => setStep("weekend")}
                disabled={weekdayTotal !== 24}
                className={`rounded-xl px-6 py-2 font-bold transition ${
                  weekdayTotal === 24
                    ? "bg-[#00ff88] text-[#0a0e1a] hover:bg-[#00cc6a]"
                    : "cursor-not-allowed border border-[rgba(0,255,136,0.2)] bg-[#0f1420] text-[#708070] opacity-50"
                }`}
              >
                次は 週末24Hへ
              </button>
            </div>
          </section>
        )}

        {/* ===== 週末：48時間 ===== */}
        {step === "weekend" && (
          <section className="rounded-xl border border-[rgba(0,255,136,0.2)] bg-[#141a2a] p-6 shadow-sm">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#00ff88]">2 / 3</p>
                <h2 className="mb-1 text-lg font-bold text-[#e0f0e8]">週末の24時間を教えてください</h2>
                <p className="text-sm leading-[1.7] text-[#a0c0b0]">
                  土日2日間の「平均」として書き出してみましょう。
                </p>
              </div>
              {/* デジタル時計 */}
              <div className={`shrink-0 rounded-lg border bg-[#0f1420] px-5 py-3 text-right shadow-neon ${
                weekendTotal > 24 ? "border-red-500/50" : "border-[rgba(0,255,136,0.3)]"
              }`}>
                <div className="flex items-baseline justify-end gap-0.5 font-mono leading-none">
                  <span className={`text-5xl font-black tracking-tight text-glow-neon ${
                    weekendTotal > 24 ? "text-red-400" : weekendTotal === 24 ? "text-[#00ff88]" : "text-[#e0f0e8]"
                  }`}>
                    {String(Math.floor(weekendTotal)).padStart(2, "0")}
                  </span>
                  <span className={`text-3xl font-black ${
                    weekendTotal > 24 ? "text-red-400" : weekendTotal === 24 ? "text-[#00ff88]" : "text-[#e0f0e8]"
                  }`}>:</span>
                  <span className={`text-5xl font-black tracking-tight text-glow-neon ${
                    weekendTotal > 24 ? "text-red-400" : weekendTotal === 24 ? "text-[#00ff88]" : "text-[#e0f0e8]"
                  }`}>
                    {weekendTotal % 1 >= 0.5 ? "30" : "00"}
                  </span>
                </div>
                {weekendTotal > 24 && (
                  <p className="mt-1 text-xs font-medium text-red-400">24時間に修正してください</p>
                )}
              </div>
            </div>

            <ActivityInputTable
              rows={weekendRows}
              onUpdate={updateWeekendRow}
              onAdd={addWeekendRow}
              onRemove={removeWeekendRow}
              onWorkType={updateWeekendWorkType}
            />
            <WorkLegend />

            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={() => setStep("weekday")}
                className="rounded-xl border border-[rgba(0,255,136,0.2)] px-4 py-2 text-[#a0c0b0] transition hover:bg-[#0f1420]"
              >
                戻る
              </button>
              <button
                type="button"
                onClick={goToMonthly}
                disabled={weekendTotal !== 24}
                className={`rounded-xl px-6 py-2 font-bold transition ${
                  weekendTotal === 24
                    ? "bg-[#00ff88] text-[#0a0e1a] hover:bg-[#00cc6a]"
                    : "cursor-not-allowed border border-[rgba(0,255,136,0.2)] bg-[#0f1420] text-[#708070] opacity-50"
                }`}
              >
                次は 月間推計へ
              </button>
            </div>
          </section>
        )}

        {/* ===== 月間推計 ===== */}
        {step === "monthly" && (
          <section className="rounded-xl border border-[rgba(0,255,136,0.2)] bg-[#141a2a] p-6 shadow-sm">
            {/* ヘッダー行：タイトル + デジタルタイマー */}
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#00ff88]">3 / 3</p>
                <h2 className="mb-1 text-lg font-bold text-[#e0f0e8]">月 500時間の内訳を分析</h2>
                <p className="text-sm leading-[1.7] text-[#a0c0b0]">
                  平日と週末の入力から月間時間を推計しました。<br />
                  月1回の活動があれば追加し、ワーク区分を確認してください。
                </p>
              </div>
              <MonthlyTimer rows={monthlyRows} />
            </div>

            {/* ワーク区分ブレイクダウン */}
            <WorkBreakdownCard rows={monthlyRows} />

            {/* 行リスト */}
            <div className="mb-2 grid grid-cols-[1fr_5.5rem_4.5rem_2rem] gap-2 px-1 text-xs font-medium text-[#708070]">
              <span>活動内容</span>
              <span className="text-center">平日/週末</span>
              <span className="text-center">月(h)</span>
              <span />
            </div>

            <div className="space-y-2">
              {monthlyRows.map((row) => (
                <div
                  key={row.id}
                  className="rounded-lg border border-[rgba(0,255,136,0.15)] bg-[#1c2438] px-3 py-2"
                >
                  {/* 入力行：活動名は全行編集可能 */}
                  <div className="grid grid-cols-[1fr_5.5rem_4.5rem_2rem] items-center gap-2">
                    <input
                      type="text"
                      value={row.description}
                      onChange={(e) => updateMonthlyExtra(row.id, "description", e.target.value)}
                      placeholder={row.source === "extra" ? "例：旅行、通院..." : "活動内容..."}
                      className="rounded border border-[rgba(0,255,136,0.15)] bg-[#0f1420] px-2 py-1.5 text-sm text-[#e0f0e8] placeholder:text-[#708070] leading-[1.7]"
                    />
                    <span className="text-center text-xs text-[#708070]">{row.perLabel || "月のみ"}</span>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={row.monthlyHours}
                      onChange={(e) =>
                        row.source === "extra"
                          ? updateMonthlyExtra(row.id, "monthlyHours", e.target.value)
                          : updateMonthlyHours(row.id, e.target.value)
                      }
                      className="rounded border border-[rgba(0,255,136,0.15)] bg-[#0f1420] px-2 py-1.5 text-center text-sm text-[#e0f0e8] leading-[1.7]"
                    />
                    <button
                      type="button"
                      onClick={() => removeMonthlyRow(row.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-[#708070] transition hover:text-red-400"
                      aria-label="削除"
                    >
                      ×
                    </button>
                  </div>
                  {/* ワーク区分バッジ */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {WORK_TYPES.map((w) => {
                      const selected = row.workType === w.id;
                      return (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => updateMonthlyWorkType(row.id, w.id)}
                          className={`w-[4.5rem] rounded-full border py-0.5 text-center text-xs font-medium transition-all ${
                            selected
                              ? w.selectedClass
                              : "border-[rgba(0,255,136,0.2)] bg-[#141a2a] text-[#708070] hover:border-[rgba(0,255,136,0.5)] hover:text-[#a0c0b0]"
                          }`}
                        >
                          {w.badge}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={addMonthlyExtra}
                className="rounded-lg border border-[rgba(0,255,136,0.2)] px-4 py-2 text-sm text-[#a0c0b0] transition hover:border-[#00ff88] hover:text-[#00ff88]"
              >
                ＋ 月1回の活動を追加
              </button>
              <button
                type="button"
                onClick={handleRequestMerge}
                disabled={merging || monthlyRows.length < 2}
                className="rounded-lg border border-[rgba(0,255,136,0.2)] px-4 py-2 text-sm text-[#a0c0b0] transition hover:border-[#00ff88] hover:text-[#00ff88] disabled:opacity-40"
              >
                {merging ? "分析中..." : "⟳ 似た活動を統合する"}
              </button>
            </div>

            {mergeError && (
              <p className="mt-2 text-sm text-red-400">{mergeError}</p>
            )}

            {/* ─── 統合確認パネル ─── */}
            {mergeSuggestions && (() => {
              const candidates = mergeSuggestions.filter((s) => s.ids.length > 1);
              return (
                <div className="mt-4 rounded-xl border border-[rgba(0,255,136,0.3)] bg-[#0f1420] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-bold text-[#e0f0e8]">
                      統合候補
                      <span className="ml-2 text-xs font-normal text-[#708070]">
                        {candidates.length}件
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setMergeSuggestions(null)}
                      className="text-xs text-[#708070] hover:text-[#a0c0b0]"
                    >
                      ✕ キャンセル
                    </button>
                  </div>

                  {candidates.length === 0 ? (
                    <p className="text-sm text-[#a0c0b0]">統合できる活動はありませんでした。</p>
                  ) : (
                    <div className="space-y-2">
                      {mergeSuggestions.map((s, i) => {
                        if (s.ids.length <= 1) return null;
                        const checked = selectedMerges.has(i);
                        const wt = WORK_TYPES.find((w) => w.id === s.workType);
                        return (
                          <label
                            key={i}
                            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all ${
                              checked
                                ? "border-[rgba(0,255,136,0.35)] bg-[#1c2438]"
                                : "border-[rgba(255,255,255,0.08)] bg-[#141a2a] opacity-60"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setSelectedMerges((prev) => {
                                  const next = new Set(prev);
                                  checked ? next.delete(i) : next.add(i);
                                  return next;
                                });
                              }}
                              className="mt-0.5 accent-[#00ff88]"
                            />
                            <div className="flex-1 min-w-0">
                              {/* 統合後 */}
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-[#e0f0e8]">
                                  {s.mergedName}
                                </span>
                                <span className="font-mono text-xs text-[#a0c0b0]">
                                  {s.totalHours}H
                                </span>
                                {wt && (
                                  <span className={`rounded-full border px-2 py-0 text-[10px] font-medium ${wt.selectedClass}`}>
                                    {wt.badge}
                                  </span>
                                )}
                              </div>
                              {/* 統合元リスト */}
                              <div className="mt-1 space-y-0.5">
                                {s.ids.map((id) => {
                                  const row = monthlyRows.find((r) => r.id === id);
                                  if (!row) return null;
                                  return (
                                    <p key={id} className="text-xs text-[#708070]">
                                      ├ {row.description}
                                      {row.perLabel && (
                                        <span className="ml-1">({row.perLabel})</span>
                                      )}
                                      　{row.monthlyHours}H
                                    </p>
                                  );
                                })}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {candidates.length > 0 && (
                    <button
                      type="button"
                      onClick={applyMerges}
                      disabled={selectedMerges.size === 0}
                      className="mt-4 w-full rounded-lg bg-[#00ff88] py-2 text-sm font-bold text-[#0a0e1a] transition hover:bg-[#00cc6a] disabled:opacity-40"
                    >
                      選択した統合を適用する（{selectedMerges.size}件）
                    </button>
                  )}
                </div>
              );
            })()}

            {error && (
              <p className="mt-3 text-sm text-red-400">{error}</p>
            )}

            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={() => setStep("weekend")}
                className="rounded-xl border border-[rgba(0,255,136,0.2)] px-4 py-2 text-[#a0c0b0] transition hover:bg-[#0f1420]"
              >
                戻る
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || monthlyRows.length === 0}
                className="rounded-xl bg-[#00ff88] px-6 py-2 font-bold text-[#0a0e1a] transition hover:bg-[#00cc6a] disabled:opacity-60"
              >
                {saving ? "保存中..." : "保存して STEP 2 へ"}
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

/* ─── 共通：活動入力テーブル ─── */
function ActivityInputTable({
  rows,
  onUpdate,
  onAdd,
  onRemove,
  onWorkType,
}: {
  rows: ActivityRow[];
  onUpdate: (id: string, f: "description" | "hours", v: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onWorkType: (id: string, wt: WorkType) => void;
}) {
  return (
    <>
      <div className="mb-2 grid grid-cols-[1fr_4.5rem_2rem] gap-2 px-1 text-xs font-medium text-[#708070]">
        <span>活動内容</span>
        <span className="text-center">時間 (h)</span>
        <span />
      </div>
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.id} className="rounded-lg border border-[rgba(0,255,136,0.15)] bg-[#1c2438] px-3 py-2">
            <div className="grid grid-cols-[1fr_4.5rem_2rem] items-center gap-2">
              <input
                type="text"
                value={row.description}
                onChange={(e) => onUpdate(row.id, "description", e.target.value)}
                placeholder="活動内容..."
                className="rounded border border-[rgba(0,255,136,0.15)] bg-[#0f1420] px-2 py-1.5 text-sm text-[#e0f0e8] placeholder:text-[#708070] leading-[1.7]"
              />
              <input
                type="number"
                min={0}
                max={24}
                step={0.5}
                value={row.hours}
                onChange={(e) => onUpdate(row.id, "hours", e.target.value)}
                placeholder="0.0"
                className="rounded border border-[rgba(0,255,136,0.15)] bg-[#0f1420] px-2 py-1.5 text-center text-sm text-[#e0f0e8] leading-[1.7]"
              />
              <button
                type="button"
                onClick={() => onRemove(row.id)}
                disabled={rows.length === 1}
                className="flex h-8 w-8 items-center justify-center rounded-md text-[#708070] transition hover:text-red-400 disabled:opacity-30"
                aria-label="削除"
              >
                ×
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {WORK_TYPES.map((w) => {
                const selected = row.workType === w.id;
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => onWorkType(row.id, w.id)}
                    className={`w-[4.5rem] rounded-full border py-0.5 text-center text-xs font-medium transition-all ${
                      selected
                        ? w.selectedClass
                        : "border-[rgba(0,255,136,0.2)] bg-[#141a2a] text-[#708070] hover:border-[rgba(0,255,136,0.5)] hover:text-[#a0c0b0]"
                    }`}
                  >
                    {w.badge}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="mt-3 rounded-lg border border-[rgba(0,255,136,0.2)] px-4 py-2 text-sm text-[#a0c0b0] transition hover:border-[#00ff88] hover:text-[#00ff88]"
      >
        ＋ 行を追加
      </button>
    </>
  );
}

/* ─── ワーク区分の凡例 ─── */
function WorkLegend() {
  return (
    <div className="mt-4 rounded-lg border border-[rgba(0,255,136,0.15)] bg-[#0f1420] px-4 py-2.5">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#708070]">ワーク区分</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {WORK_TYPES.map((w) => (
          <div key={w.id} className="flex items-center gap-2 text-xs">
            <span className={`w-[4.5rem] shrink-0 rounded-full border py-0.5 text-center font-medium ${w.selectedClass}`}>{w.badge}</span>
            <span className="truncate text-[#a0c0b0]">{w.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── 月間タイマー：睡眠除外の活動時間（クロック形式）+ 計算式注釈 ─── */
function MonthlyTimer({ rows }: { rows: MonthlyRow[] }) {
  const FULL_MONTH = 30 * 24; // 720h

  // 「睡眠」を含む行の月間合計
  const sleepTotal = Math.round(
    rows
      .filter((r) => r.description.includes("睡眠"))
      .reduce((s, r) => s + (parseFloat(r.monthlyHours) || 0), 0)
  );

  // 活動時間 = 720 - 睡眠
  const activeTotal = FULL_MONTH - sleepTotal;
  const isNear500 = activeTotal >= 450 && activeTotal <= 550;
  const colorClass = isNear500 ? "text-[#00ff88] text-glow-neon" : "text-[#e0f0e8]";

  return (
    <div className="shrink-0 rounded-lg border border-[rgba(0,255,136,0.3)] bg-[#0f1420] px-5 py-3 text-right shadow-neon">
      {/* 活動時間：クロックと同じ大きさ・スタイル */}
      <div className="flex items-baseline justify-end gap-0.5 font-mono leading-none">
        <span className={`text-5xl font-black tracking-tight ${colorClass}`}>
          {String(activeTotal).padStart(3, "0")}
        </span>
        <span className={`text-3xl font-bold ${colorClass}`}>H</span>
      </div>
      {/* 計算式の注釈 */}
      {sleepTotal > 0 && (
        <p className="mt-1.5 font-mono text-[10px] leading-snug text-[#a0c0b0]">
          30日×24H − 睡眠{sleepTotal}H ＝ {activeTotal}H
        </p>
      )}
    </div>
  );
}

/* ─── 月間：ワーク区分ブレイクダウンカード ─── */
function WorkBreakdownCard({ rows }: { rows: MonthlyRow[] }) {
  // 睡眠を除いた活動時間を分母にする（MonthlyTimerと揃える）
  const sleepTotal = rows
    .filter((r) => r.description.includes("睡眠"))
    .reduce((s, r) => s + (parseFloat(r.monthlyHours) || 0), 0);
  const total = 30 * 24 - sleepTotal;

  const byType: Partial<Record<WorkType, number>> = {};
  for (const r of rows) {
    const wt: WorkType = r.workType ?? "E";
    byType[wt] = (byType[wt] ?? 0) + (parseFloat(r.monthlyHours) || 0);
  }

  return (
    // 前ページと同じ3層構造：section(#141a2a) > card(#1c2438) > input(#0f1420)
    <div className="mb-4 grid grid-cols-5 gap-2">
      {WORK_TYPES.map((w) => {
        const h = Math.round((byType[w.id] ?? 0) * 10) / 10;
        const pct = total > 0 ? Math.round(((byType[w.id] ?? 0) / total) * 100) : 0;
        return (
          <div
            key={w.id}
            className="flex flex-col items-center gap-2 rounded-lg border border-[rgba(0,255,136,0.15)] bg-[#1c2438] py-3"
          >
            {/* バッジ：ガイドライン準拠 w-[4.5rem] text-xs font-medium */}
            <span className={`w-[4.5rem] rounded-full border py-0.5 text-center text-xs font-medium ${w.selectedClass}`}>
              {w.badge}
            </span>
            {/* 時間 */}
            <span className="font-mono text-sm font-bold leading-none text-[#e0f0e8]">
              {h}<span className="ml-0.5 text-xs font-normal text-[#708070]">H</span>
            </span>
            {/* パーセント */}
            <span className="font-mono text-xs text-[#708070]">{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── 共通：合計プログレスバー ─── */
function TotalBar({
  total,
  target,
  unit,
}: {
  total: number;
  target: number;
  unit: string;
}) {
  const pct = Math.min(100, (total / target) * 100);
  const isGood = total >= target * 0.9 && total <= target * 1.1;
  const isOver = total > target * 1.1;

  return (
    <div className="mt-6 rounded-xl border border-[rgba(0,255,136,0.2)] bg-[#0f1420] p-4">
      <div className="mb-2 flex justify-between text-sm">
        <span className="text-[#a0c0b0]">合計</span>
        <span className={`font-bold ${totalColor(total, target)}`}>
          {Math.round(total * 10) / 10} {unit}
          <span className="ml-2 text-xs font-normal text-[#708070]">（目安 {target}h）</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#141a2a]">
        <div
          className="h-full rounded-full bg-neon-bar transition-all duration-500"
          style={{ width: `${pct}%`, background: "linear-gradient(90deg, #00ff88, #00cc6a)" }}
        />
      </div>
      <p className="mt-2 text-xs text-[#708070]">
        {isGood && "だいたい揃っています！"}
        {isOver && `目安より ${Math.round((total - target) * 10) / 10}h 多いです。見直してみましょう。`}
        {!isGood && !isOver && `あと ${Math.round((target - total) * 10) / 10}h`}
      </p>
    </div>
  );
}
