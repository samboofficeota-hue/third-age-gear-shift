"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { WORK_TYPES, WORK_COLORS, type WorkType } from "@/lib/workTypes";

const WORKS = WORK_TYPES;

type Classification = { description: string; hours: number; workType: WorkType | null };

export default function Block2Page() {
  const [step, setStep] = useState<"intro" | "classifying" | "review">("intro");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classifications, setClassifications] = useState<Classification[]>([]);
  const [saving, setSaving] = useState(false);
  const [hasActivities, setHasActivities] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/workshop/me", { credentials: "include" });
      if (res.status === 401) {
        window.location.href = "/login?from=/workshop/block-2";
        return;
      }
      const data = await res.json();
      const w = data.workshopData;

      const activities = w?.step1?.activities ?? [];
      setHasActivities(activities.length > 0);

      // If AI classifications already exist, go straight to review
      if (w?.step2?.classifications?.length > 0) {
        setClassifications(
          (w.step2.classifications as Classification[]).map((c) => ({
            ...c,
            workType: c.workType ?? null,
          }))
        );
        setStep("review");
      }

      setLoading(false);
    })();
  }, []);

  const totals = useMemo(() => {
    const t: Record<WorkType, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    for (const c of classifications) {
      if (c.workType) t[c.workType] += c.hours;
    }
    return t;
  }, [classifications]);

  const totalHours = useMemo(
    () => classifications.reduce((sum, c) => sum + c.hours, 0),
    [classifications]
  );

  const classifiedCount = classifications.filter((c) => c.workType !== null).length;
  const allClassified =
    classifications.length > 0 && classifiedCount === classifications.length;

  const assign = (idx: number, workType: WorkType) => {
    setClassifications((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, workType } : c))
    );
  };

  const handleClassify = async () => {
    setStep("classifying");
    setError(null);
    try {
      const res = await fetch("/api/workshop/me/step2/classify", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "分類に失敗しました。");
      }
      const data = await res.json();
      setClassifications(data.classifications);
      setStep("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "分類に失敗しました。");
      setStep("intro");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/workshop/me/step2", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classifications, totals }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "保存に失敗しました。");
      return;
    }
    window.location.href = "/workshop/block-3";
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
          <Link href="/workshop/block-1" className="text-primary hover:underline">
            ← Block 1
          </Link>
          {" · "}
          STEP 2：4つのワークへの仕分け
        </p>

        {/* ===== Intro ===== */}
        {step === "intro" && (
          <section className="rounded-xl border border-[rgba(0,255,136,0.2)] bg-[#141a2a] p-8 shadow-sm">
            <p className="mb-6 leading-relaxed text-[#a0c0b0]">
              書き出してもらった活動を、ハンディの4つのワークに分類します。AIが自動で分類しますので、確認・修正してください。
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {WORKS.filter((w) => w.id !== "E").map((w) => (
                <div
                  key={w.id}
                  className="rounded-xl border border-[rgba(0,255,136,0.2)] p-4"
                  style={{ borderLeftWidth: 4, borderLeftColor: WORK_COLORS[w.id] }}
                >
                  <p className="font-medium text-[#e0f0e8]">{w.label}</p>
                  <p className="mt-0.5 text-xs text-[#708070]">{w.sub}</p>
                </div>
              ))}
            </div>
            <div
              className="mt-3 rounded-xl border border-[rgba(0,255,136,0.2)] p-4"
              style={{ borderLeftWidth: 4, borderLeftColor: WORK_COLORS["E"] }}
            >
              <p className="font-medium text-[#708070]">その他</p>
              <p className="mt-0.5 text-xs text-[#708070]">
                移動・通勤・SNS・娯楽・無駄時間など
              </p>
            </div>

            {!hasActivities && (
              <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
                STEP 1の活動が見つかりません。先に
                <Link href="/workshop/block-1" className="underline">Block 1</Link>
                で活動を入力してください。
              </p>
            )}

            {error && (
              <p className="mt-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="mt-6 flex justify-center">
              <Button onClick={handleClassify} disabled={!hasActivities}>
                AIで自動分類する
              </Button>
            </div>
          </section>
        )}

        {/* ===== AI Classifying ===== */}
        {step === "classifying" && (
          <section className="rounded-xl border border-[rgba(0,255,136,0.2)] bg-[#141a2a] p-8 shadow-sm">
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-[rgba(0,255,136,0.2)] border-t-primary" />
              <p className="text-[#a0c0b0]">AIが分類中...</p>
              <p className="text-xs text-[#708070]">少しお待ちください</p>
            </div>
          </section>
        )}

        {/* ===== Review ===== */}
        {step === "review" && (
          <section className="rounded-xl border border-[rgba(0,255,136,0.2)] bg-[#141a2a] p-6 shadow-sm">
            <h2 className="mb-1 text-lg font-bold text-[#e0f0e8]">分類結果を確認する</h2>
            <p className="mb-1 text-sm text-[#708070]">
              AIが分類しました。違うと思ったら変更してください。
            </p>
            <p className="mb-6 text-xs text-[#708070]">
              {classifiedCount} / {classifications.length} 件 分類済み
            </p>

            {/* Activity rows */}
            <div className="space-y-3">
              {classifications.map((c, idx) => (
                <div
                  key={idx}
                  className={`rounded-xl border p-4 transition-colors ${
                    c.workType
                      ? "border-[rgba(0,255,136,0.2)] bg-[#141a2a]"
                      : "border-dashed border-[rgba(0,255,136,0.3)] bg-[#0f1420]"
                  }`}
                >
                  <div className="mb-3 flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium text-[#e0f0e8]">{c.description}</span>
                    <span className="flex-shrink-0 text-sm tabular-nums text-[#708070]">
                      {c.hours}時間
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {WORKS.map((w) => {
                      const selected = c.workType === w.id;
                      return (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => assign(idx, w.id)}
                          className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                            selected
                              ? w.selectedClass
                              : "border-[rgba(0,255,136,0.2)] bg-[#141a2a] text-[#a0c0b0] hover:border-[rgba(0,255,136,0.5)]"
                          }`}
                        >
                          {w.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Running totals */}
            <div className="mt-6 rounded-xl border border-[rgba(0,255,136,0.2)] bg-[#0f1420] p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#708070]">
                集計
              </p>
              <div className="space-y-2">
                {WORKS.map((w) => {
                  const hours = totals[w.id];
                  const pct = totalHours > 0 ? Math.round((hours / totalHours) * 100) : 0;
                  return (
                    <div key={w.id} className="flex items-center gap-3">
                      <div className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${w.dotClass}`} />
                      <span className="min-w-0 flex-1 truncate text-xs text-[#a0c0b0]">
                        {w.label}
                      </span>
                      <span className="text-xs font-medium text-[#a0c0b0]">{hours}時間</span>
                      <span className="w-8 text-right text-xs text-[#708070]">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {error && (
              <p className="mt-3 text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <div className="mt-6 flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setClassifications([]);
                  setStep("intro");
                }}
              >
                やり直す
              </Button>
              <Button onClick={handleSave} disabled={saving || !allClassified}>
                {saving ? "保存中..." : "保存して STEP 3 へ"}
              </Button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
