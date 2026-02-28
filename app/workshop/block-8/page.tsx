"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

const WORKS_AD = [
  { id: "A", label: "A. 有償ワーク",      color: "#78716C" },  // stone
  { id: "B", label: "B. 家事・育児・介護", color: "#3B82F6" },  // blue
  { id: "C", label: "C. ギフトワーク",    color: "#2E9E5B" },  // green
  { id: "D", label: "D. 学習ワーク",      color: "#F97316" },  // orange
] as const;

const PHASE_COLORS = ["#2E9E5B", "#3B82F6", "#F97316"];

type Phase = {
  phase_number: 1 | 2 | 3;
  name: string;
  duration_months: number;
  increase_work: string[];
  decrease_work: string[];
  key_actions: string[];
  success_definition: string;
};

type Capitals = {
  human: { strengths: string; growth: string; score: number };
  social: { network: string; community: string; score: number };
  financial: { other_income: boolean; detail: string };
};

export default function Block8Page() {
  const [loading, setLoading] = useState(true);

  // Data from all steps
  const [profileName, setProfileName] = useState("");
  const [step2Totals, setStep2Totals] = useState({ A: 0, B: 0, C: 0, D: 0, E: 0 });
  const [step3, setStep3] = useState<{ future_D?: number; future_C?: number; future_B?: number }>({});
  const [capitals, setCapitals] = useState<Capitals | null>(null);
  const [step6, setStep6] = useState<{
    will?: string; must?: string; can?: string;
    loop_description?: string; ideal_loop?: string;
  }>({});
  const [phases, setPhases] = useState<Phase[]>([]);
  const [firstStep, setFirstStep] = useState("");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/workshop/me", { credentials: "include" });
      if (res.status === 401) {
        window.location.href = "/login?from=/workshop/block-8";
        return;
      }
      const json = await res.json();
      const w = json.workshopData;

      if (w?.profile?.name) setProfileName(String(w.profile.name));

      if (w?.step2?.totals) {
        const t = w.step2.totals;
        setStep2Totals({
          A: Number(t.A) || 0,
          B: Number(t.B) || 0,
          C: Number(t.C) || 0,
          D: Number(t.D) || 0,
          E: Number(t.E) || 0,
        });
      }

      if (w?.step3) setStep3(w.step3);

      if (w?.step5?.capitals) setCapitals(w.step5.capitals as Capitals);

      if (w?.step6) setStep6(w.step6);

      if (w?.step7) {
        const s7 = w.step7 as { phases?: Phase[]; first_step?: string };
        if (Array.isArray(s7.phases) && s7.phases.length === 3) {
          setPhases(s7.phases as Phase[]);
        }
        setFirstStep(s7.first_step ?? "");
      }

      setLoading(false);
    })();
  }, []);

  // Current allocation (A-D only, normalized to 100%)
  const currentAlloc = useMemo(() => {
    const { A, B, C, D } = step2Totals;
    const adTotal = A + B + C + D;
    if (adTotal === 0) return { pct: { A: 0, B: 0, C: 0, D: 0 }, hours: { A, B, C, D }, adTotal: 0 };
    return {
      pct: {
        A: Math.round((A / adTotal) * 100),
        B: Math.round((B / adTotal) * 100),
        C: Math.round((C / adTotal) * 100),
        D: Math.round((D / adTotal) * 100),
      },
      hours: { A, B, C, D },
      adTotal,
    };
  }, [step2Totals]);

  // Future allocation
  const futureAlloc = useMemo(() => {
    const fD = Math.max(0, Math.min(50, step3.future_D ?? 0));
    const fC = Math.max(0, Math.min(40, step3.future_C ?? 0));
    const fB = Math.max(0, Math.min(40, step3.future_B ?? 0));
    const fA = Math.max(0, 100 - fD - fC - fB);
    return { A: fA, B: fB, C: fC, D: fD };
  }, [step3]);

  // Mitchie's closing message (logic-based)
  const mitchieMessage = useMemo(() => {
    const name = profileName ? `${profileName}さん` : "あなた";
    const phaseNames = phases.map((p) => p.name).filter(Boolean);
    const phaseText =
      phaseNames.length === 3
        ? `「${phaseNames[0]}」→「${phaseNames[1]}」→「${phaseNames[2]}」`
        : "3つのPhase";

    const hScore = capitals?.human?.score ?? 3;
    const sScore = capitals?.social?.score ?? 3;
    let capitalComment = "";
    if (hScore <= 2) {
      capitalComment =
        "人的資本への投資（学習・健康）を優先することで、将来の可能性が広がります。";
    } else if (sScore <= 2) {
      capitalComment =
        "社会資本（つながり・コミュニティ）を育てることが、次のステージへの扉を開きます。";
    } else {
      capitalComment =
        "すでに基盤となる資本が整っています。あとは行動あるのみです。";
    }

    return { name, phaseText, capitalComment };
  }, [profileName, phases, capitals]);

  const today = new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-stone-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="min-h-screen bg-stone-50 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-3xl">

          {/* ナビ */}
          <div className="no-print mb-6 flex items-center justify-between">
            <p className="text-sm text-stone-500">
              <Link href="/workshop/block-7" className="text-community hover:underline">
                ← Block 7
              </Link>
              {" · "}
              自分の経営計画書
            </p>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-xl bg-community px-4 py-2 text-sm text-white transition hover:bg-community-light"
            >
              印刷・PDF保存
            </button>
          </div>

          {/* ===== 表紙 ===== */}
          <section className="mb-6 rounded-2xl border border-stone-200 bg-white p-10 shadow-sm text-center">
            <p className="mb-1 text-xs text-stone-400">サードエイジへのギア・シフト</p>
            <h1 className="mb-2 text-3xl font-bold text-stone-800">自分の経営計画書</h1>
            {profileName && (
              <p className="mb-6 text-xl text-stone-600">{profileName}</p>
            )}
            <p className="text-sm text-stone-400">{today}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {["時間のポートフォリオ", "3つの資本", "Will/Must/Can", "5年間の移行計画"].map(
                (label) => (
                  <span
                    key={label}
                    className="rounded-full border border-community/30 bg-community/5 px-3 py-1 text-xs text-community"
                  >
                    {label}
                  </span>
                )
              )}
            </div>
          </section>

          {/* ===== 時間のポートフォリオ ===== */}
          <section className="mb-6 rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-stone-800">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-community text-xs font-bold text-white">
                1
              </span>
              時間のポートフォリオ
            </h2>

            <div className="grid grid-cols-2 gap-8">
              {/* 現在 */}
              <div>
                <p className="mb-3 text-sm font-semibold text-stone-600">現在の配分（A〜D）</p>
                <div className="space-y-3">
                  {WORKS_AD.map((w) => {
                    const h = currentAlloc.hours[w.id];
                    const pct = currentAlloc.pct[w.id];
                    return (
                      <div key={w.id}>
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="font-medium" style={{ color: w.color }}>
                            {w.label}
                          </span>
                          <span className="text-stone-500">
                            {h}h ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
                          <div
                            className="h-2 rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: w.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                {step2Totals.E > 0 && (
                  <p className="mt-2 text-xs text-stone-400">
                    その他: {step2Totals.E}h（参考）
                  </p>
                )}
              </div>

              {/* 10年後 */}
              <div>
                <p className="mb-3 text-sm font-semibold text-stone-600">10年後の理想配分</p>
                <div className="space-y-3">
                  {WORKS_AD.map((w) => {
                    const pct = futureAlloc[w.id];
                    return (
                      <div key={w.id}>
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="font-medium" style={{ color: w.color }}>
                            {w.label}
                          </span>
                          <span className="text-stone-500">{pct}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
                          <div
                            className="h-2 rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: w.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* ===== 3つの資本 ===== */}
          <section className="mb-6 rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-stone-800">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-community text-xs font-bold text-white">
                2
              </span>
              3つの資本の現状
            </h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* 人的資本 */}
              <div className="rounded-xl border border-stone-200 p-4">
                <p className="mb-3 font-semibold text-stone-800">🧠 人的資本</p>
                <div className="mb-3 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div
                      key={n}
                      className={`h-2.5 flex-1 rounded-full ${
                        n <= (capitals?.human?.score ?? 0) ? "bg-community" : "bg-stone-100"
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-xs font-bold text-stone-500">
                    {capitals?.human?.score ?? "-"}/5
                  </span>
                </div>
                {capitals?.human?.strengths && (
                  <p className="text-xs text-stone-600">
                    <span className="font-medium text-stone-500">強み：</span>
                    {capitals.human.strengths}
                  </p>
                )}
                {capitals?.human?.growth && (
                  <p className="mt-1 text-xs text-stone-600">
                    <span className="font-medium text-stone-500">伸ばしたい：</span>
                    {capitals.human.growth}
                  </p>
                )}
              </div>

              {/* 社会資本 */}
              <div className="rounded-xl border border-stone-200 p-4">
                <p className="mb-3 font-semibold text-stone-800">🤝 社会資本</p>
                <div className="mb-3 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div
                      key={n}
                      className={`h-2.5 flex-1 rounded-full ${
                        n <= (capitals?.social?.score ?? 0) ? "bg-blue-500" : "bg-stone-100"
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-xs font-bold text-stone-500">
                    {capitals?.social?.score ?? "-"}/5
                  </span>
                </div>
                {capitals?.social?.network && (
                  <p className="text-xs text-stone-600">
                    <span className="font-medium text-stone-500">つながり：</span>
                    {capitals.social.network}
                  </p>
                )}
                {capitals?.social?.community && (
                  <p className="mt-1 text-xs text-stone-600">
                    <span className="font-medium text-stone-500">コミュニティ：</span>
                    {capitals.social.community}
                  </p>
                )}
              </div>

              {/* 金融資本 */}
              <div className="rounded-xl border border-stone-200 p-4">
                <p className="mb-3 font-semibold text-stone-800">💰 金融資本</p>
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    capitals?.financial?.other_income
                      ? "bg-community/10 text-community"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {capitals?.financial?.other_income ? "複数の収入源あり" : "現在は有償ワークのみ"}
                </span>
                {capitals?.financial?.detail && (
                  <p className="mt-2 text-xs text-stone-600">{capitals.financial.detail}</p>
                )}
              </div>
            </div>
          </section>

          {/* ===== Will / Must / Can ===== */}
          <section className="mb-6 rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-stone-800">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-community text-xs font-bold text-white">
                3
              </span>
              Will / Must / Can と資本循環
            </h2>

            <div className="mb-6 grid grid-cols-3 gap-3">
              {[
                { label: "Will", color: "#F97316", value: step6.will ?? "" },  // orange
                { label: "Must", color: "#e11d48", value: step6.must ?? "" },  // rose（警告色として維持）
                { label: "Can", color: "#3B82F6", value: step6.can ?? "" },   // blue
              ].map(({ label, color, value }) => (
                <div key={label} className="rounded-xl border border-stone-100 bg-stone-50 p-4">
                  <p className="mb-2 text-sm font-bold" style={{ color }}>
                    {label}
                  </p>
                  <p className="text-xs leading-relaxed text-stone-600 whitespace-pre-wrap">
                    {value || "（未入力）"}
                  </p>
                </div>
              ))}
            </div>

            {step6.ideal_loop && (
              <div className="rounded-xl border border-community/20 bg-green-50/40 p-4">
                <p className="mb-1 text-xs font-semibold text-community">理想のループ</p>
                <p className="text-sm leading-relaxed text-stone-700 whitespace-pre-wrap">
                  {step6.ideal_loop}
                </p>
              </div>
            )}
          </section>

          {/* ===== 5年間の移行計画 ===== */}
          <section className="mb-6 rounded-2xl border border-stone-200 bg-white p-8 shadow-sm page-break">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-stone-800">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-community text-xs font-bold text-white">
                4
              </span>
              5年間の移行計画
            </h2>

            {phases.length > 0 ? (
              <>
                {/* Gantt bar */}
                <div className="mb-6 flex h-10 overflow-hidden rounded-xl shadow-sm">
                  {phases.map((p, i) => {
                    const totalMonths = phases.reduce((s, ph) => s + ph.duration_months, 0);
                    const base = Math.max(totalMonths, 60);
                    return (
                      <div
                        key={p.phase_number}
                        className="flex items-center justify-center text-xs font-bold text-white"
                        style={{
                          width: `${(p.duration_months / base) * 100}%`,
                          backgroundColor: PHASE_COLORS[i],
                          minWidth: "2rem",
                        }}
                      >
                        {p.name || `P${p.phase_number}`}
                      </div>
                    );
                  })}
                </div>

                {/* Phase detail cards */}
                <div className="space-y-4">
                  {phases.map((p, i) => (
                    <div
                      key={p.phase_number}
                      className="flex gap-4 rounded-xl border border-stone-100 p-5"
                    >
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                        style={{ backgroundColor: PHASE_COLORS[i] }}
                      >
                        {p.phase_number}
                      </div>
                      <div className="flex-1">
                        <div className="mb-2 flex items-baseline gap-2">
                          <p className="font-semibold text-stone-800">{p.name}</p>
                          <p className="text-xs text-stone-400">{p.duration_months}ヶ月</p>
                        </div>
                        {p.key_actions.filter(Boolean).length > 0 && (
                          <ul className="mb-2 space-y-0.5">
                            {p.key_actions.filter(Boolean).map((a, j) => (
                              <li key={j} className="flex items-start gap-1 text-sm text-stone-600">
                                <span className="font-bold text-stone-300">{j + 1}.</span> {a}
                              </li>
                            ))}
                          </ul>
                        )}
                        {p.success_definition && (
                          <div className="rounded-lg bg-stone-50 px-3 py-2">
                            <p className="text-xs text-stone-500">
                              <span className="font-medium">成功の定義：</span>
                              {p.success_definition}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-stone-400">（Block 7 で移行計画を入力してください）</p>
            )}

            {/* 明日の第一歩 */}
            {firstStep && (
              <div className="mt-6 rounded-xl border-2 border-community/40 bg-community/5 p-5">
                <p className="mb-2 text-sm font-bold text-community">明日の第一歩</p>
                <p className="leading-relaxed text-stone-800 whitespace-pre-wrap">{firstStep}</p>
              </div>
            )}
          </section>

          {/* ===== ファシリテーターメッセージ ===== */}
          <section className="mb-8 rounded-2xl border border-community/30 bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-lg font-bold text-stone-800">ファシリテーターより</h2>

            <div className="space-y-4 leading-relaxed text-stone-700">
              <p>{mitchieMessage.name}、2日間のワークショップ、本当によく取り組まれました。</p>

              {step6.will && (
                <p>
                  「{step6.will}」——このWillを胸に、これからのサードエイジを歩んでください。
                </p>
              )}

              <p>
                {mitchieMessage.phaseText}という移行計画で、着実に理想のポートフォリオへ近づいていけます。
                {mitchieMessage.capitalComment}
              </p>

              {firstStep && (
                <p>
                  そして、明日の第一歩——「<strong>{firstStep}</strong>」。
                  この小さな一歩が、5年後の景色を変えます。
                </p>
              )}

              <p className="mt-2 font-semibold text-community">
                この経営計画書が、あなたの羅針盤となることを願っています。
              </p>
            </div>
          </section>

          {/* 印刷ボタン */}
          <div className="no-print flex justify-center pb-8">
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-xl bg-community px-10 py-3 text-white transition hover:bg-community-light"
            >
              印刷・PDF保存
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
