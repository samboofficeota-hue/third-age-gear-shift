"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Capitals = {
  human: { strengths: string; growth: string; score: number };
  social: { network: string; community: string; score: number };
  financial: { other_income: boolean; detail: string };
};

const defaultCapitals = (): Capitals => ({
  human: { strengths: "", growth: "", score: 3 },
  social: { network: "", community: "", score: 3 },
  financial: { other_income: false, detail: "" },
});

function ScoreInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`h-9 w-9 rounded-full text-sm font-bold transition ${
            value === n
              ? "bg-community text-white"
              : "bg-stone-100 text-stone-500 hover:bg-stone-200"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

function CapitalBar({ label, score, color }: { label: string; score: number; color: string }) {
  const isLow = score <= 2;
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 text-sm text-stone-600">{label}</span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-stone-100">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${(score / 5) * 100}%`, backgroundColor: isLow ? "#e11d48" : color }}
        />
      </div>
      <span className={`w-6 text-right text-sm font-bold ${isLow ? "text-rose-600" : "text-stone-700"}`}>
        {score}
      </span>
    </div>
  );
}

export default function Block5Page() {
  const [step, setStep] = useState<"intro" | "form" | "review">("intro");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capitals, setCapitals] = useState<Capitals>(defaultCapitals());

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/workshop/me", { credentials: "include" });
      if (res.status === 401) {
        window.location.href = "/login?from=/workshop/block-5";
        return;
      }
      const data = await res.json();
      const w = data.workshopData;
      if (w?.step5?.capitals && typeof w.step5.capitals === "object") {
        const c = w.step5.capitals as Capitals;
        setCapitals({
          human: {
            strengths: c.human?.strengths ?? "",
            growth: c.human?.growth ?? "",
            score: Number(c.human?.score) || 3,
          },
          social: {
            network: c.social?.network ?? "",
            community: c.social?.community ?? "",
            score: Number(c.social?.score) || 3,
          },
          financial: {
            other_income: Boolean(c.financial?.other_income),
            detail: c.financial?.detail ?? "",
          },
        });
      }
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/workshop/me/step5", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        human_strengths: capitals.human.strengths,
        human_growth: capitals.human.growth,
        human_score: capitals.human.score,
        social_network: capitals.social.network,
        social_community: capitals.social.community,
        social_score: capitals.social.score,
        financial_other_income: capitals.financial.other_income,
        financial_detail: capitals.financial.detail,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d?.error ?? "保存に失敗しました。");
      return false;
    }
    return true;
  };

  const handleToReview = async () => {
    const ok = await save();
    if (ok) setStep("review");
  };

  const handleToBlock6 = async () => {
    const ok = await save();
    if (ok) window.location.href = "/workshop/block-6";
  };

  const lowestCapital = (): { label: string; reason: string } => {
    const h = capitals.human.score;
    const s = capitals.social.score;
    if (h <= s && h <= 3) {
      return { label: "人的資本", reason: "スキル・知識への投資を増やすことで、有償ワークやギフトワークの質が高まります。" };
    }
    if (s < h && s <= 3) {
      return { label: "社会資本", reason: "社外とのつながりを広げることで、新しい機会やギフトワークの場が生まれます。" };
    }
    return { label: "金融資本", reason: "複数の収入源を検討することで、ポートフォリオの安定性が高まります。" };
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
          <Link href="/workshop/block-4" className="text-community hover:underline">
            ← Block 4
          </Link>
          {" · "}
          STEP 5：4つの資本の監査
        </p>

        {/* 5-A: 導入 */}
        {step === "intro" && (
          <section className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
            <p className="mb-4 leading-relaxed text-stone-700">
              DAY 2 へようこそ。今日は「資本」の視点で、あなたの未来を設計します。
            </p>
            <p className="mb-6 leading-relaxed text-stone-700">
              あなたが使う時間（500時間）は、3つの資本に変換されています。その現状を確認しましょう。
            </p>

            {/* 資本フロー図 */}
            <div className="mb-6 rounded-xl border border-stone-200 bg-stone-50 p-5">
              <div className="flex items-center gap-3 overflow-x-auto text-xs">
                <div className="flex shrink-0 flex-col items-center gap-1">
                  <div className="rounded-lg bg-community px-3 py-2 text-sm font-bold text-white">500時間</div>
                  <span className="text-stone-500">時間</span>
                </div>
                <div className="shrink-0 text-stone-400">→</div>
                <div className="flex shrink-0 flex-col gap-1.5">
                  {[
                    { label: "A. 有償", color: "#78716C" },
                    { label: "B. 家事", color: "#3B82F6" },
                    { label: "C. ギフト", color: "#2E9E5B" },
                    { label: "D. 学習", color: "#F97316" },
                  ].map((w) => (
                    <div key={w.label} className="rounded px-2 py-1 text-xs font-medium text-white" style={{ backgroundColor: w.color }}>
                      {w.label}
                    </div>
                  ))}
                </div>
                <div className="shrink-0 text-stone-400">→</div>
                <div className="flex shrink-0 flex-col gap-2">
                  {[
                    { label: "人的資本", emoji: "🧠", desc: "スキル・知識・健康" },
                    { label: "社会資本", emoji: "🤝", desc: "つながり・信頼" },
                    { label: "金融資本", emoji: "💰", desc: "経済的な余力" },
                  ].map((c) => (
                    <div key={c.label} className="rounded border border-stone-300 bg-white px-2 py-1">
                      <div className="text-xs font-medium text-stone-700">{c.emoji} {c.label}</div>
                      <div className="text-xs text-stone-400">{c.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-3 text-center text-xs text-stone-400">
                あなたの時間の使い方が、3つの資本をどう育てているかを確認します
              </p>
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setStep("form")}
                className="rounded-xl bg-community px-6 py-3 text-white transition hover:bg-community-light"
              >
                資本の現状を入力する
              </button>
            </div>
          </section>
        )}

        {/* 5-B: 資本の自己評価フォーム */}
        {step === "form" && (
          <section className="space-y-6">
            {/* 人的資本 */}
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <span className="text-2xl">🧠</span>
                <div>
                  <h2 className="text-lg font-bold text-stone-800">人的資本</h2>
                  <p className="text-xs text-stone-500">スキル・知識・健康など、あなた自身の強み</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">
                    今、誇れるスキル・知識は何ですか？
                  </label>
                  <textarea
                    rows={2}
                    value={capitals.human.strengths}
                    onChange={(e) => setCapitals((c) => ({ ...c, human: { ...c.human, strengths: e.target.value } }))}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                    placeholder="例：プロジェクト管理の経験、語学力、専門的な技術知識..."
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">
                    伸ばしたいスキルは何ですか？
                  </label>
                  <textarea
                    rows={2}
                    value={capitals.human.growth}
                    onChange={(e) => setCapitals((c) => ({ ...c, human: { ...c.human, growth: e.target.value } }))}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                    placeholder="例：デジタルマーケティング、コーチング、健康管理..."
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-stone-700">
                    現在の充実度（1＝低い　5＝高い）
                  </label>
                  <ScoreInput value={capitals.human.score} onChange={(v) => setCapitals((c) => ({ ...c, human: { ...c.human, score: v } }))} />
                </div>
              </div>
            </div>

            {/* 社会資本 */}
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <span className="text-2xl">🤝</span>
                <div>
                  <h2 className="text-lg font-bold text-stone-800">社会資本</h2>
                  <p className="text-xs text-stone-500">信頼できるつながり・コミュニティへの貢献</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">
                    信頼できる社外のつながりはありますか？
                  </label>
                  <textarea
                    rows={2}
                    value={capitals.social.network}
                    onChange={(e) => setCapitals((c) => ({ ...c, social: { ...c.social, network: e.target.value } }))}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                    placeholder="例：業界の知人、異業種交流会のメンバー、地域の仲間..."
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">
                    貢献できているコミュニティはありますか？
                  </label>
                  <textarea
                    rows={2}
                    value={capitals.social.community}
                    onChange={(e) => setCapitals((c) => ({ ...c, social: { ...c.social, community: e.target.value } }))}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                    placeholder="例：NPO、地域活動、業界団体、趣味のグループ..."
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-stone-700">
                    現在の充実度（1＝低い　5＝高い）
                  </label>
                  <ScoreInput value={capitals.social.score} onChange={(v) => setCapitals((c) => ({ ...c, social: { ...c.social, score: v } }))} />
                </div>
              </div>
            </div>

            {/* 金融資本 */}
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <span className="text-2xl">💰</span>
                <div>
                  <h2 className="text-lg font-bold text-stone-800">金融資本</h2>
                  <p className="text-xs text-stone-500">有償ワーク以外の経済的な基盤</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-stone-700">
                    有償ワーク以外の収入源はありますか？
                  </label>
                  <div className="flex gap-3">
                    {[{ label: "ある", value: true }, { label: "ない・検討中", value: false }].map(({ label, value }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setCapitals((c) => ({ ...c, financial: { ...c.financial, other_income: value } }))}
                        className={`flex-1 rounded-lg border py-2 text-sm font-medium transition ${
                          capitals.financial.other_income === value
                            ? "border-community bg-community/10 text-community"
                            : "border-stone-300 text-stone-600 hover:bg-stone-50"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">
                    詳しく教えてください（任意）
                  </label>
                  <textarea
                    rows={2}
                    value={capitals.financial.detail}
                    onChange={(e) => setCapitals((c) => ({ ...c, financial: { ...c.financial, detail: e.target.value } }))}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                    placeholder="例：不動産収入、投資、副業の準備をしている..."
                  />
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setStep("intro")} className="rounded-xl border border-stone-300 px-4 py-2 text-stone-600">
                戻る
              </button>
              <button
                type="button"
                onClick={handleToReview}
                disabled={saving}
                className="rounded-xl bg-community px-6 py-2 text-white disabled:opacity-60"
              >
                {saving ? "保存中..." : "確認する"}
              </button>
            </div>
          </section>
        )}

        {/* 5-C: 滞留ポイントの確認 + ミッチーコメント */}
        {step === "review" && (() => {
          const lowest = lowestCapital();
          return (
            <section className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
              <h2 className="mb-6 text-lg font-bold text-stone-800">資本の現状サマリー</h2>

              <div className="mb-6 space-y-4">
                <CapitalBar label="🧠 人的資本" score={capitals.human.score} color="#2E9E5B" />
                <CapitalBar label="🤝 社会資本" score={capitals.social.score} color="#3B82F6" />
                <div className="flex items-center gap-3">
                  <span className="w-24 text-sm text-stone-600">💰 金融資本</span>
                  <div className="flex-1">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                      capitals.financial.other_income
                        ? "bg-community/10 text-community"
                        : "bg-amber-50 text-amber-700"
                    }`}>
                      {capitals.financial.other_income ? "複数の収入源あり" : "現在は有償ワークのみ"}
                    </span>
                  </div>
                </div>
                {(capitals.human.score <= 2 || capitals.social.score <= 2) && (
                  <p className="text-xs text-rose-600">※ 赤いバーは要注意の資本です</p>
                )}
              </div>

              <div className="mb-6 rounded-xl border border-community/30 bg-green-50/40 p-5">
                <p className="leading-relaxed text-stone-700">
                  データを見ると、<strong>{lowest.label}</strong>が手薄に見えます。{lowest.reason}
                </p>
                <p className="mt-2 text-stone-600">
                  次のステップで、この資本をどう循環させるかを一緒に考えましょう。
                </p>
              </div>

              {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setStep("form")} className="rounded-xl border border-stone-300 px-4 py-2 text-stone-600">
                  戻る
                </button>
                <button
                  type="button"
                  onClick={handleToBlock6}
                  disabled={saving}
                  className="rounded-xl bg-community px-6 py-3 text-white transition hover:bg-community-light disabled:opacity-60"
                >
                  {saving ? "保存中..." : "STEP 6 へ進む"}
                </button>
              </div>
            </section>
          );
        })()}
      </div>
    </div>
  );
}
