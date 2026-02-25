"use client";

import { useEffect, useState } from "react";

const AGE_OPTIONS = [
  { value: "40s", label: "40代" },
  { value: "50s", label: "50代" },
  { value: "60s", label: "60代前半" },
] as const;

const FEELING_OPTIONS = [
  { value: "不安", label: "不安" },
  { value: "期待", label: "期待" },
  { value: "面倒くさい", label: "面倒くさい" },
  { value: "ワクワク", label: "ワクワク" },
  { value: "よくわからない", label: "よくわからない" },
] as const;

type Profile = {
  name?: string;
  age_group?: string;
  role?: string;
  years_of_service?: number;
  initial_feeling?: string[];
};

export default function Block0Page() {
  const [step, setStep] = useState<"welcome" | "profile" | "flow">("welcome");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile>({
    name: "",
    age_group: "",
    role: "",
    years_of_service: undefined,
    initial_feeling: [],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/workshop/me", { credentials: "include" });
      if (res.status === 401) {
        window.location.href = "/login?from=/workshop/block-0";
        return;
      }
      const data = await res.json();
      // セッション未参加ならコード入力ページへ
      if (!data.workshopData?.sessionId) {
        window.location.href = "/workshop/join";
        return;
      }
      if (data.workshopData?.profile) {
        const p = data.workshopData.profile as Profile;
        setProfile({
          name: p.name ?? "",
          age_group: p.age_group ?? "",
          role: p.role ?? "",
          years_of_service: p.years_of_service,
          initial_feeling: p.initial_feeling ?? [],
        });
      }
      setLoading(false);
    })();
  }, []);

  const handleStart = () => setStep("profile");

  const handleFeelingToggle = (value: string) => {
    const current = profile.initial_feeling ?? [];
    const next = current.includes(value)
      ? current.filter((f) => f !== value)
      : [...current, value];
    setProfile((p) => ({ ...p, initial_feeling: next }));
  };

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/workshop/me/profile", {
      method: "PATCH",
      credentials: "include", // Cookie を確実に送る
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: profile.name || undefined,
        age_group: profile.age_group || undefined,
        role: profile.role || undefined,
        years_of_service:
          profile.years_of_service !== undefined
            ? Number(profile.years_of_service)
            : undefined,
        initial_feeling:
          profile.initial_feeling?.length ? profile.initial_feeling : undefined,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setStep("flow");
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "保存に失敗しました。");
    }
  };

  const handleStartDay1 = () => {
    window.location.href = "/workshop/block-1";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-stone-500">読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-2xl">
        {/* 0-B: ウェルカム */}
        {step === "welcome" && (
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
            <p className="mb-6 whitespace-pre-wrap text-center leading-relaxed text-stone-700">
              {`はじめまして。私はミッチーです。
これから2日間、あなたの「次の30年」を一緒に設計していきます。
まず、お名前を教えていただけますか？`}
            </p>
            <p className="mb-8 text-center text-sm text-stone-500">
              （次の画面でプロフィールを入力します）
            </p>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleStart}
                className="rounded-xl bg-community px-6 py-3 text-white transition hover:bg-community-light"
              >
                はじめましょう
              </button>
            </div>
          </section>
        )}

        {/* 0-C: プロフィール入力 */}
        {step === "profile" && (
          <section className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-lg font-bold text-stone-800">
              プロフィール
            </h2>
            <form onSubmit={handleSubmitProfile} className="space-y-6">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-600">
                  お名前（呼び方）
                </label>
                <input
                  type="text"
                  value={profile.name ?? ""}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, name: e.target.value }))
                  }
                  className="w-full rounded-lg border border-stone-300 px-3 py-2"
                  placeholder="ミッチーが呼びかける名前"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-600">
                  年齢
                </label>
                <select
                  value={profile.age_group ?? ""}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      age_group: e.target.value || undefined,
                    }))
                  }
                  className="w-full rounded-lg border border-stone-300 px-3 py-2"
                >
                  <option value="">選択してください</option>
                  {AGE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-600">
                  現在の職種・役割
                </label>
                <input
                  type="text"
                  value={profile.role ?? ""}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, role: e.target.value }))
                  }
                  className="w-full rounded-lg border border-stone-300 px-3 py-2"
                  placeholder="自由記入"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-600">
                  会社員歴（年）
                </label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={profile.years_of_service ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setProfile((p) => ({
                      ...p,
                      years_of_service: v === "" ? undefined : parseInt(v, 10),
                    }));
                  }}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2"
                  placeholder="勤続年数"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-stone-600">
                  今の気持ち（複数可）
                </label>
                <div className="flex flex-wrap gap-2">
                  {FEELING_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => handleFeelingToggle(o.value)}
                      className={`rounded-full px-4 py-2 text-sm transition ${
                        profile.initial_feeling?.includes(o.value)
                          ? "bg-community text-white"
                          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setStep("welcome")}
                  className="rounded-xl border border-stone-300 px-4 py-2 text-stone-600"
                >
                  戻る
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-community px-6 py-2 text-white disabled:opacity-60"
                >
                  {saving ? "保存中..." : "保存して次へ"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* 0-D: 研修の進め方 */}
        {step === "flow" && (
          <section className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
            <p className="mb-4 rounded-lg bg-community-lighter/20 px-3 py-2 text-sm text-stone-700">
              プロフィールはサーバー（データベース）に保存されました。
            </p>
            <h2 className="mb-4 text-lg font-bold text-stone-800">
              研修の進め方
            </h2>
            <p className="mb-6 text-stone-600">
              2日間で7つのSTEPを進めます。途中で中断しても、再開できます。データは保存されます。
            </p>
            <ul className="mb-8 list-inside list-disc space-y-1 text-sm text-stone-600">
              <li>STEP 1：500時間の棚卸し</li>
              <li>STEP 2：4つのワークへの仕分け</li>
              <li>STEP 3：10年後のポートフォリオ設計</li>
              <li>STEP 4：As-Is / To-Be サマリー</li>
              <li>STEP 5：4つの資本の監査</li>
              <li>STEP 6：資本循環の構造化</li>
              <li>STEP 7：5年間の移行計画</li>
              <li>アウトプット：自分の経営計画書</li>
            </ul>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleStartDay1}
                className="rounded-xl bg-community px-6 py-3 text-white transition hover:bg-community-light"
              >
                DAY 1 を始める
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
