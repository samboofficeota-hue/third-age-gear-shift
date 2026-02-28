"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

type ActivityRow = { id: string; description: string; hours: string };

function newRow(): ActivityRow {
  return { id: crypto.randomUUID(), description: "", hours: "" };
}

export default function Block1Page() {
  const [step, setStep] = useState<"intro" | "form">("intro");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<ActivityRow[]>([newRow()]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/workshop/me", { credentials: "include" });
      if (res.status === 401) {
        window.location.href = "/login?from=/workshop/block-1";
        return;
      }
      const data = await res.json();
      const acts = data.workshopData?.step1?.activities;
      if (Array.isArray(acts) && acts.length > 0) {
        setRows(
          acts.map((a: { description: string; hours: number }) => ({
            id: crypto.randomUUID(),
            description: a.description ?? "",
            hours: String(a.hours ?? ""),
          }))
        );
      }
      setLoading(false);
    })();
  }, []);

  const total = useMemo(
    () => rows.reduce((sum, r) => sum + (parseFloat(r.hours) || 0), 0),
    [rows]
  );

  const addRow = () => setRows((prev) => [...prev, newRow()]);

  const removeRow = (id: string) =>
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));

  const updateRow = (id: string, field: "description" | "hours", value: string) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const activities = rows
      .filter((r) => r.description.trim() || parseFloat(r.hours) > 0)
      .map((r) => ({
        description: r.description.trim(),
        hours: parseFloat(r.hours) || 0,
      }));
    const res = await fetch("/api/workshop/me/step1", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activities }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "保存に失敗しました。");
      return;
    }
    window.location.href = "/workshop/block-2";
  };

  const progressPct = Math.min(100, (total / 500) * 100);
  const isInRange = total >= 480 && total <= 520;
  const isEmpty = rows.every((r) => !r.description.trim() && !r.hours);

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
          <Link href="/workshop/block-0" className="text-primary hover:underline">
            ← Block 0
          </Link>
          {" · "}
          STEP 1：500時間の棚卸し
        </p>

        {/* ===== Intro ===== */}
        {step === "intro" && (
          <section className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
            <p className="mb-4 leading-relaxed text-stone-700">
              先月1ヶ月を思い出してください。朝起きてから夜寝るまで、どんなことに時間を使いましたか？
            </p>
            <p className="mb-4 leading-relaxed text-stone-700">
              仕事、通勤、会議、家事、子供の送り迎え、友人との食事、趣味、勉強、運動...
              なんでもかまいません。思い浮かぶことを、1行ずつどんどん書き出してください。
            </p>
            <p className="mb-8 leading-relaxed text-stone-700">
              合計が約<strong>500時間</strong>（1ヶ月分）になるまで、積み上げていきましょう。
            </p>
            <div className="flex justify-center">
              <Button onClick={() => setStep("form")}>書き出す</Button>
            </div>
          </section>
        )}

        {/* ===== Form ===== */}
        {step === "form" && (
          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-lg font-bold text-stone-800">先月1ヶ月の活動を書き出す</h2>
            <p className="mb-6 text-sm text-stone-500">
              どんな内容に何時間かけたか、1行ずつ書いてください。合計が約500時間になるまで積み上げます。
            </p>

            {/* Column header */}
            <div className="mb-1 flex gap-2 px-1 text-xs font-medium text-stone-400">
              <span className="flex-1">どんな内容？</span>
              <span className="w-20 text-center">時間数</span>
              <span className="w-8" />
            </div>

            {/* Rows */}
            <div className="space-y-2">
              {rows.map((row) => (
                <div key={row.id} className="flex items-center gap-2">
                  <Input
                    value={row.description}
                    onChange={(e) => updateRow(row.id, "description", e.target.value)}
                    placeholder="例: 通勤、会議、料理、散歩..."
                    className="flex-1 text-sm"
                  />
                  <Input
                    type="number"
                    min={0}
                    max={500}
                    step={1}
                    value={row.hours}
                    onChange={(e) => updateRow(row.id, "hours", e.target.value)}
                    placeholder="0"
                    className="w-20 text-center text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    disabled={rows.length === 1}
                    className="flex h-9 w-8 items-center justify-center rounded-md text-stone-400 transition hover:text-destructive disabled:opacity-30"
                    aria-label="この行を削除"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addRow}
              className="mt-3"
            >
              ＋ 行を追加
            </Button>

            {/* 500h progress */}
            <div className="mt-6 rounded-xl border border-stone-200 bg-stone-50 p-4">
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-stone-600">合計</span>
                <span className="font-bold text-stone-800">
                  {Math.round(total * 10) / 10} 時間
                </span>
              </div>
              <Progress value={progressPct} className="h-2" />
              <p
                className={`mt-2 text-sm ${isInRange ? "font-medium text-primary" : "text-stone-500"}`}
              >
                {total < 480 &&
                  `あと ${Math.round((500 - total) * 10) / 10} 時間で 500 時間`}
                {isInRange && "だいたい揃っています！次のステップへ進みましょう。"}
                {total > 520 &&
                  total <= 600 &&
                  "少し多めです。睡眠時間（約240時間）は含んでいますか？"}
                {total > 600 &&
                  "合計が多すぎるようです。睡眠時間は除いて考えましょう。"}
              </p>
            </div>

            {error && (
              <p className="mt-3 text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <div className="mt-6 flex justify-between">
              <Button variant="outline" onClick={() => setStep("intro")}>
                戻る
              </Button>
              <Button onClick={handleSave} disabled={saving || isEmpty}>
                {saving ? "保存中..." : "保存して STEP 2 へ"}
              </Button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
