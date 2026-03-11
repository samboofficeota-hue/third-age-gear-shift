"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Capitals = {
  human: { strengths: string; growth: string; score: number };
  social: { network: string; community: string; score: number };
  financial: { other_income: boolean; detail: string; score: number };
};

const defaultCapitals = (): Capitals => ({
  human: { strengths: "", growth: "", score: 3 },
  social: { network: "", community: "", score: 3 },
  financial: { other_income: false, detail: "", score: 3 },
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
            score: Number(c.financial?.score) || 3,
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
        financial_score: capitals.financial.score,
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
    const f = capitals.financial.score;
    const min = Math.min(h, s, f);
    if (h === min) {
      return { label: "人的資本", reason: "スキル・知識への投資を増やすことで、有償ワークやギフトワークの質が高まります。" };
    }
    if (s === min) {
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
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">
              図：人生というプロジェクトの原理（山口周）
            </p>
            <div className="mb-6 overflow-x-auto rounded-xl border border-stone-100 bg-stone-50 p-3">
              <svg
                viewBox="0 0 570 440"
                style={{ minWidth: 460 }}
                className="w-full"
                aria-label="4つの資本の関係図"
              >
                <defs>
                  <marker id="arr" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="#6B7280" />
                  </marker>
                  <marker id="arr-or" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="#F97316" />
                  </marker>
                </defs>

                {/* 時間資本 outer container (midpoint y = 8 + 360/2 = 188) */}
                <rect x="8" y="8" width="196" height="360" rx="10" fill="#FAFAF9" stroke="#A8A29E" strokeWidth="2" />
                <text x="106" y="26" textAnchor="middle" fontWeight="bold" fontSize="13" fill="#1C1917">時間資本</text>

                {/* A - Paid Work (y=38, center y=72) */}
                <rect x="18" y="38" width="166" height="68" rx="6" fill="#F5F5F4" stroke="#78716C" strokeWidth="1.5" />
                <text x="29" y="58" fontWeight="bold" fontSize="13" fill="#78716C">A</text>
                <text x="47" y="58" fontSize="11" fill="#1C1917">お金をもらうワーク</text>
                <text x="29" y="73" fontSize="10" fill="#78716C">Paid Work</text>
                <text x="29" y="88" fontSize="9" fill="#B4A99B">収入・給与・報酬</text>

                {/* B - Home Work (y=116, center y=150) */}
                <rect x="18" y="116" width="166" height="68" rx="6" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="1.5" />
                <text x="29" y="136" fontWeight="bold" fontSize="13" fill="#3B82F6">B</text>
                <text x="47" y="136" fontSize="11" fill="#1C1917">家族のためのワーク</text>
                <text x="29" y="151" fontSize="10" fill="#78716C">Home Work</text>
                <text x="29" y="166" fontSize="9" fill="#B4A99B">家族・家事・育児</text>

                {/* C - Gift Work (y=194, center y=228) */}
                <rect x="18" y="194" width="166" height="68" rx="6" fill="#F0FDF4" stroke="#2E9E5B" strokeWidth="1.5" />
                <text x="29" y="214" fontWeight="bold" fontSize="13" fill="#2E9E5B">C</text>
                <text x="47" y="214" fontSize="11" fill="#1C1917">社会に貢献するワーク</text>
                <text x="29" y="229" fontSize="10" fill="#78716C">Gift Work</text>
                <text x="29" y="244" fontSize="9" fill="#B4A99B">ボランティア・NPO</text>

                {/* D - Study Work (y=272, center y=306) */}
                <rect x="18" y="272" width="166" height="68" rx="6" fill="#FFF7ED" stroke="#F97316" strokeWidth="1.5" />
                <text x="29" y="292" fontWeight="bold" fontSize="13" fill="#F97316">D</text>
                <text x="47" y="292" fontSize="11" fill="#1C1917">自分を高めるワーク</text>
                <text x="29" y="307" fontSize="10" fill="#78716C">Study Work</text>
                <text x="29" y="322" fontSize="9" fill="#B4A99B">学習・スキルアップ</text>

                {/* 人的資本 (center y=151+37.5=188.5 ≈ container midpoint 188) */}
                <rect x="328" y="151" width="230" height="75" rx="8" fill="white" stroke="#F97316" strokeWidth="1.5" />
                <text x="443" y="172" textAnchor="middle" fontWeight="bold" fontSize="13" fill="#1C1917">人的資本</text>
                <text x="342" y="190" fontSize="11" fill="#57534E">● スキル</text>
                <text x="342" y="205" fontSize="11" fill="#57534E">● 知識</text>
                <text x="342" y="220" fontSize="11" fill="#57534E">● 経験</text>

                {/* 社会資本 */}
                <rect x="328" y="253" width="230" height="75" rx="8" fill="white" stroke="#3B82F6" strokeWidth="1.5" />
                <text x="443" y="274" textAnchor="middle" fontWeight="bold" fontSize="13" fill="#1C1917">社会資本</text>
                <text x="342" y="292" fontSize="11" fill="#57534E">● 信用・評判</text>
                <text x="342" y="307" fontSize="11" fill="#57534E">● ネットワーク</text>
                <text x="342" y="322" fontSize="11" fill="#57534E">● 友人・家族関係</text>

                {/* 金融資本 */}
                <rect x="328" y="355" width="230" height="75" rx="8" fill="white" stroke="#78716C" strokeWidth="1.5" />
                <text x="443" y="376" textAnchor="middle" fontWeight="bold" fontSize="13" fill="#1C1917">金融資本</text>
                <text x="342" y="394" fontSize="11" fill="#57534E">● 現金</text>
                <text x="342" y="409" fontSize="11" fill="#57534E">● 株式・債券</text>
                <text x="342" y="424" fontSize="11" fill="#57534E">● 不動産等</text>

                {/* Arrow: 時間資本 → 人的資本 (horizontal, y=188) */}
                <line x1="206" y1="188" x2="326" y2="188" stroke="#F97316" strokeWidth="2" markerEnd="url(#arr-or)" />

                {/* Vertical: 人的資本(bottom=226) → 社会資本(top=253) */}
                <line x1="443" y1="228" x2="443" y2="251" stroke="#6B7280" strokeWidth="1.5" markerEnd="url(#arr)" />

                {/* Vertical: 社会資本(bottom=328) → 金融資本(top=355) */}
                <line x1="443" y1="330" x2="443" y2="353" stroke="#6B7280" strokeWidth="1.5" markerEnd="url(#arr)" />
              </svg>
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
                <div>
                  <label className="mb-2 block text-sm font-medium text-stone-700">
                    現在の充実度（1＝低い　5＝高い）
                  </label>
                  <ScoreInput value={capitals.financial.score} onChange={(v) => setCapitals((c) => ({ ...c, financial: { ...c.financial, score: v } }))} />
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
                <CapitalBar label="💰 金融資本" score={capitals.financial.score} color="#78716C" />
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
