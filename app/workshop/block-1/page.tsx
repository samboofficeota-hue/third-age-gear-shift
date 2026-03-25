"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { WORK_TYPES, type WorkType } from "@/lib/workTypes";

type ActivityRow = { id: string; description: string; hours: string; workType: WorkType | null };
type MonthlyRow = {
  id: string;
  description: string;
  source: "weekday" | "weekend" | "extra";
  perLabel: string;   // 表示用：「平日 Xh/日」など
  monthlyHours: string;
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
    });
  }
  return rows;
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
          ? s1.monthlyExtras.map((a: { description?: string; hours?: number }) => ({
              id: crypto.randomUUID(),
              description: a.description ?? "",
              source: "extra" as const,
              perLabel: "",
              monthlyHours: String(a.hours ?? ""),
            }))
          : [];
        setMonthlyRows([...computed, ...extras]);
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
    setMonthlyRows([...computed, ...existingExtras]);
    setStep("monthly");
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
      .map((r) => ({ description: r.description.trim(), hours: parseFloat(r.monthlyHours) || 0 }));

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
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#00ff88]">3 / 3</p>
            <h2 className="mb-1 text-lg font-bold text-[#e0f0e8]">1ヶ月・500時間の内訳を確認する</h2>
            <p className="mb-6 text-sm leading-[1.7] text-[#a0c0b0]">
              平日と週末の入力から月間時間を推計しました。<br />
              月1回の活動（通院、旅行など）があれば追加し、他を調整してください。
            </p>

            {/* ヘッダー */}
            <div className="mb-2 grid grid-cols-[1fr_6rem_5rem] gap-2 px-1 text-xs font-medium text-[#708070]">
              <span>活動内容</span>
              <span className="text-center">平日/週末</span>
              <span className="text-center">月 (h)</span>
            </div>

            <div className="space-y-2">
              {monthlyRows.map((row) => (
                <div key={row.id} className="grid grid-cols-[1fr_6rem_5rem_2rem] items-center gap-2">
                  {row.source === "extra" ? (
                    <input
                      type="text"
                      value={row.description}
                      onChange={(e) => updateMonthlyExtra(row.id, "description", e.target.value)}
                      placeholder="例：旅行、通院..."
                      className="rounded-lg border border-[rgba(0,255,136,0.2)] bg-[#0f1420] px-3 py-2 text-sm text-[#e0f0e8] placeholder:text-[#708070] leading-[1.7]"
                    />
                  ) : (
                    <span className="truncate px-1 text-sm text-[#e0f0e8]">{row.description}</span>
                  )}
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
                    className="rounded-lg border border-[rgba(0,255,136,0.2)] bg-[#0f1420] px-2 py-2 text-center text-sm text-[#e0f0e8] leading-[1.7]"
                  />
                  <button
                    type="button"
                    onClick={() => removeMonthlyRow(row.id)}
                    className="flex h-9 w-8 items-center justify-center rounded-md text-[#708070] hover:text-red-400"
                    aria-label="削除"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addMonthlyExtra}
              className="mt-3 rounded-lg border border-[rgba(0,255,136,0.2)] px-4 py-2 text-sm text-[#a0c0b0] transition hover:border-[#00ff88] hover:text-[#00ff88]"
            >
              ＋ 月1回の活動を追加
            </button>

            <TotalBar total={monthlyTotal} target={480} unit="h / 月" />

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
