"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

const CATEGORIES = [
  {
    key: "paid_work_hours",
    label: "本業・関連",
    sub: "通常業務・残業・移動・メール・会食",
  },
  {
    key: "home_work_hours",
    label: "生活維持",
    sub: "料理・掃除・洗濯・買い物・名もなき家事",
  },
  {
    key: "care_hours",
    label: "ケア・付き合い",
    sub: "子供・親の世話・親戚付き合い・町内会",
  },
  {
    key: "study_hours",
    label: "自己投資",
    sub: "読書・資格・ジム・副業準備",
  },
  {
    key: "leisure_hours",
    label: "娯楽・休息",
    sub: "テレビ・SNS・趣味・目的のない付き合い",
  },
  {
    key: "other_hours",
    label: "その他",
    sub: "通院・諸手続き・不明な時間",
  },
] as const;

type Step1Data = {
  paid_work_hours?: number;
  home_work_hours?: number;
  care_hours?: number;
  study_hours?: number;
  leisure_hours?: number;
  other_hours?: number;
  total?: number;
  user_feeling_comment?: string;
};

const INITIAL_STEP1: Step1Data = {
  paid_work_hours: 0,
  home_work_hours: 0,
  care_hours: 0,
  study_hours: 0,
  leisure_hours: 0,
  other_hours: 0,
  total: 0,
};

export default function Block1Page() {
  const [step, setStep] = useState<"intro" | "form" | "comment">("intro");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step1, setStep1] = useState<Step1Data>(INITIAL_STEP1);
  const [feelingComment, setFeelingComment] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/workshop/me", { credentials: "include" });
      if (res.status === 401) {
        window.location.href = "/login?from=/workshop/block-1";
        return;
      }
      const data = await res.json();
      if (data.workshopData?.step1 && typeof data.workshopData.step1 === "object") {
        const s = data.workshopData.step1 as Step1Data;
        setStep1({
          paid_work_hours: s.paid_work_hours ?? 0,
          home_work_hours: s.home_work_hours ?? 0,
          care_hours: s.care_hours ?? 0,
          study_hours: s.study_hours ?? 0,
          leisure_hours: s.leisure_hours ?? 0,
          other_hours: s.other_hours ?? 0,
          total: s.total ?? 0,
          user_feeling_comment: s.user_feeling_comment,
        });
        setFeelingComment(s.user_feeling_comment ?? "");
      }
      setLoading(false);
    })();
  }, []);

  const total = useMemo(() => {
    const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
    return (
      n(step1.paid_work_hours) +
      n(step1.home_work_hours) +
      n(step1.care_hours) +
      n(step1.study_hours) +
      n(step1.leisure_hours) +
      n(step1.other_hours)
    );
  }, [step1]);

  const remaining = 500 - total;
  const isInRange = total >= 480 && total <= 520;
  const isOver = total > 520;

  const handleHoursChange = (key: keyof Step1Data, value: number) => {
    setStep1((prev) => ({ ...prev, [key]: Math.max(0, value) }));
  };

  const saveStep1 = async (extra?: { user_feeling_comment?: string }) => {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/workshop/me/step1", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paid_work_hours: step1.paid_work_hours ?? 0,
        home_work_hours: step1.home_work_hours ?? 0,
        care_hours: step1.care_hours ?? 0,
        study_hours: step1.study_hours ?? 0,
        leisure_hours: step1.leisure_hours ?? 0,
        other_hours: step1.other_hours ?? 0,
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

  const handleToForm = () => setStep("form");

  const handleFormNext = async () => {
    const ok = await saveStep1();
    if (ok) setStep("comment");
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await saveStep1({ user_feeling_comment: feelingComment.trim() });
    if (ok) window.location.href = "/workshop/block-2";
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
          <Link href="/workshop/block-0" className="text-community hover:underline">
            ← Block 0
          </Link>
          {" · "}
          STEP 1：500時間の棚卸し
        </p>

        {/* 1-A: ミッチー導入 */}
        {step === "intro" && (
          <section className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
            <div className="mb-6 flex justify-center">
              <div
                className="h-24 w-24 rounded-full bg-community-light opacity-90"
                aria-hidden
              />
            </div>
            <h1 className="mb-4 text-center text-xl font-bold text-stone-800">
              ミッチー
            </h1>
            <p className="mb-4 whitespace-pre-wrap leading-relaxed text-stone-700">
              先月1ヶ月を振り返ってみましょう。まず、仕事関連の時間から。
            </p>
            <p className="mb-4 leading-relaxed text-stone-700">
              平日の1日を思い浮かべてください。朝起きてから夜寝るまで、どんなことに時間を使っていましたか？
            </p>
            <p className="mb-8 leading-relaxed text-stone-700">
              では、それを数字に落としていきましょう。次の画面で6つのカテゴリに時間を入力してください。合計が約500時間（1ヶ月）になるように調整します。
            </p>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleToForm}
                className="rounded-xl bg-community px-6 py-3 text-white transition hover:bg-community-light"
              >
                時間を入力する
              </button>
            </div>
          </section>
        )}

        {/* 1-B: 時間入力フォーム */}
        {step === "form" && (
          <section className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
            <h2 className="mb-2 text-lg font-bold text-stone-800">
              先月1ヶ月の時間（時間数）
            </h2>
            <p className="mb-6 text-sm text-stone-500">
              各カテゴリに当てはまる時間を入力してください。合計が約500時間になるようにします。
            </p>

            <div className="space-y-5">
              {CATEGORIES.map(({ key, label, sub }) => (
                <div key={key}>
                  <label className="mb-1 block text-sm font-medium text-stone-600">
                    {label}
                  </label>
                  <p className="mb-1 text-xs text-stone-400">{sub}</p>
                  <input
                    type="number"
                    min={0}
                    max={744}
                    step={1}
                    value={(step1[key as keyof Step1Data] as number) ?? 0}
                    onChange={(e) =>
                      handleHoursChange(
                        key as keyof Step1Data,
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="w-full rounded-lg border border-stone-300 px-3 py-2"
                  />
                </div>
              ))}
            </div>

            {/* 合計・500hカウンター */}
            <div className="mt-8 rounded-xl border border-stone-200 bg-stone-50 p-6">
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-stone-600">合計</span>
                <span className="font-bold text-stone-800">{total} 時間</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-stone-200">
                <div
                  className="h-full rounded-full bg-community transition-all duration-300"
                  style={{ width: `${Math.min(100, (total / 500) * 100)}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-stone-600">
                {remaining > 0 && `残り ${remaining} 時間 で 500 時間`}
                {remaining <= 0 && remaining >= -20 && "だいたい揃っています"}
                {remaining < -20 && "合計が 500 時間を超えています"}
              </p>
              {isInRange && (
                <p className="mt-1 text-sm text-community font-medium">
                  だいたい揃っています。このまま「確認へ」を押して進めましょう。
                </p>
              )}
              {isOver && total > 550 && (
                <p className="mt-1 text-sm text-amber-700">
                  少し多いかもしれません。睡眠時間は含んでいませんか？
                </p>
              )}
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
                onClick={handleFormNext}
                disabled={saving}
                className="rounded-xl bg-community px-6 py-2 text-white disabled:opacity-60"
              >
                {saving ? "保存中..." : "保存して確認へ"}
              </button>
            </div>
          </section>
        )}

        {/* 1-C: ミッチー確認・感想 */}
        {step === "comment" && (
          <section className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
            <div className="mb-6 flex justify-center">
              <div
                className="h-24 w-24 rounded-full bg-community-light opacity-90"
                aria-hidden
              />
            </div>
            <h2 className="mb-4 text-lg font-bold text-stone-800">
              ミッチーからの確認
            </h2>
            <p className="mb-6 leading-relaxed text-stone-700">
              先月は合計 <strong>{total} 時間</strong> を記入されましたね。
              本業・関連が約 {total > 0 ? Math.round(((step1.paid_work_hours ?? 0) / total) * 100) : 0}%
              を占めています。この時間の使い方を見て、どんな感想がありますか？
            </p>

            <form onSubmit={handleCommentSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-600">
                  感想（任意）
                </label>
                <textarea
                  value={feelingComment}
                  onChange={(e) => setFeelingComment(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2"
                  placeholder="自由に書いてください"
                />
              </div>
              {error && (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setStep("form")}
                  className="rounded-xl border border-stone-300 px-4 py-2 text-stone-600"
                >
                  戻る
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-community px-6 py-2 text-white disabled:opacity-60"
                >
                  {saving ? "保存中..." : "STEP 2 へ進む"}
                </button>
              </div>
            </form>
          </section>
        )}
      </div>
    </div>
  );
}
