"use client";

import { useEffect, useState } from "react";

const AGE_OPTIONS = [
  { value: "40s_early", label: "40代前半" },
  { value: "40s_late",  label: "40代後半" },
  { value: "50s_early", label: "50代前半" },
  { value: "50s_late",  label: "50代後半" },
  { value: "60s_early", label: "60代前半" },
] as const;

const FEELING_OPTIONS = [
  { value: "不安", label: "不安" },
  { value: "期待", label: "期待" },
  { value: "面倒くさい", label: "面倒くさい" },
  { value: "ワクワク", label: "ワクワク" },
  { value: "眠い", label: "眠い" },
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
        <p className="text-[#708070]">読み込み中...</p>
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
    <div className="min-h-screen px-4 py-8 md:px-8">
      <div className="mx-auto max-w-2xl">
        {/* 0-B: ウェルカム */}
        {step === "welcome" && (
          <section className="rounded-xl border border-[rgba(0,255,136,0.2)] bg-[#141a2a] p-8 shadow-sm">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#00ff88]">
              ミドルシニア社員向け　キャリア戦略プログラム
            </p>
            <h1 className="mb-4 text-2xl font-bold text-[#e0f0e8]">
              サードエイジ じぶん戦略講座
            </h1>
            <p className="mb-6 leading-relaxed text-[#a0c0b0]">
              このままでいたい気持ちと、これからは変わりたいという気持ち。<br />
              その交差点に立つ今のミドルシニアの地図は、誰が持っているのか？<br />
              義務と責任のセカンドエイジを越え、自己実現のサードエイジへ──<br />
              次の30年に向けた「じぶん戦略」を、自身の手で描く2日間の講座です。
            </p>
            <p className="mb-8 text-center text-sm text-[#708070]">
              （次の画面でプロフィールを入力します）
            </p>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleStart}
                className="rounded-xl bg-[#00ff88] px-6 py-3 text-[#0a0e1a] font-bold transition hover:bg-[#00cc6a]"
              >
                はじめましょう
              </button>
            </div>
          </section>
        )}

        {/* 0-C: プロフィール入力 */}
        {step === "profile" && (
          <section className="rounded-xl border border-[rgba(0,255,136,0.2)] bg-[#141a2a] p-8 shadow-sm">
            <h2 className="mb-6 text-lg font-bold text-[#e0f0e8]">
              プロフィール
            </h2>
            <form onSubmit={handleSubmitProfile} className="space-y-6">
              <div>
                <label className="mb-1 block text-sm font-medium text-[#a0c0b0]">
                  お名前（呼び方）
                </label>
                <input
                  type="text"
                  value={profile.name ?? ""}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, name: e.target.value }))
                  }
                  className="w-full rounded-lg border border-[rgba(0,255,136,0.2)] bg-[#0f1420] px-3 py-2 text-[#e0f0e8] placeholder:text-[#708070] leading-[1.7]"
                  placeholder="ニックネームでもOK"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#a0c0b0]">
                  年代
                </label>
                <select
                  value={profile.age_group ?? ""}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      age_group: e.target.value || undefined,
                    }))
                  }
                  className="w-full rounded-lg border border-[rgba(0,255,136,0.2)] bg-[#0f1420] px-3 py-2 text-[#e0f0e8] leading-[1.7]"
                >
                  <option value="" className="bg-[#0f1420] text-[#708070]">選択してください</option>
                  {AGE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value} className="bg-[#0f1420] text-[#e0f0e8]">
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#a0c0b0]">
                  現在の職種・役割
                </label>
                <input
                  type="text"
                  value={profile.role ?? ""}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, role: e.target.value }))
                  }
                  className="w-full rounded-lg border border-[rgba(0,255,136,0.2)] bg-[#0f1420] px-3 py-2 text-[#e0f0e8] placeholder:text-[#708070] leading-[1.7]"
                  placeholder="自由記入"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#a0c0b0]">
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
                  className="w-full rounded-lg border border-[rgba(0,255,136,0.2)] bg-[#0f1420] px-3 py-2 text-[#e0f0e8] placeholder:text-[#708070] leading-[1.7]"
                  placeholder="勤続年数"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[#a0c0b0]">
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
                          ? "bg-[#00ff88] text-[#0a0e1a] font-bold"
                          : "bg-[#0f1420] text-[#a0c0b0] hover:bg-[#141a2a]"
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
                  className="rounded-xl border border-[rgba(0,255,136,0.2)] px-4 py-2 text-[#a0c0b0]"
                >
                  戻る
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#00ff88] px-6 py-2 text-[#0a0e1a] font-bold disabled:opacity-60"
                >
                  {saving ? "保存中..." : "保存して次へ"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* 0-D: 研修の進め方 */}
        {step === "flow" && (
          <section className="rounded-xl border border-[rgba(0,255,136,0.2)] bg-[#141a2a] p-8 shadow-sm">
            <h2 className="mb-4 text-xl font-bold text-[#e0f0e8]">
              {profile.name ? `${profile.name}さん、` : ""}この講座の流れは次の通りです
            </h2>
            <p className="mb-6 leading-[1.7] text-[#a0c0b0]">
              3時間×2日間の段階的プログラムです。<br />
              DAY 1 の後、DAY 2 に向けた「宿題」があります。
            </p>
            <div className="mb-8 space-y-4">
              <div className="rounded-lg border border-[rgba(0,255,136,0.2)] bg-[#0f1420] p-4">
                <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#00ff88]">DAY 1</p>
                <p className="mb-1 font-bold text-[#e0f0e8]">「はたらく」ポートフォリオ</p>
                <p className="text-sm text-[#a0c0b0]">4つの「WORK」ポートフォリオ分析をもとに、やりたいこと・すべきことなど活動を言語化</p>
              </div>
              <div className="rounded-lg border border-[rgba(0,255,136,0.2)] bg-[#0f1420] p-4">
                <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#00ff88]">DAY 2</p>
                <p className="mb-1 font-bold text-[#e0f0e8]">「ギアシフト」戦略シート</p>
                <p className="text-sm text-[#a0c0b0]">自分に内在する「MVV」を言語化して、これから実現したいミッションと行動計画を策定</p>
              </div>
            </div>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleStartDay1}
                className="rounded-xl bg-[#00ff88] px-6 py-3 text-[#0a0e1a] font-bold transition hover:bg-[#00cc6a]"
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
