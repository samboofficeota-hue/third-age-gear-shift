"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Step6Data = {
  will: string;
  must: string;
  can: string;
  loop_description: string;
  ideal_loop: string;
};

const defaultData = (): Step6Data => ({
  will: "",
  must: "",
  can: "",
  loop_description: "",
  ideal_loop: "",
});

export default function Block6Page() {
  const [step, setStep] = useState<"intro" | "will_must_can" | "loop" | "done">("intro");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Step6Data>(defaultData());

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/workshop/me", { credentials: "include" });
      if (res.status === 401) {
        window.location.href = "/login?from=/workshop/block-6";
        return;
      }
      const json = await res.json();
      const w = json.workshopData;
      if (w?.step6 && typeof w.step6 === "object") {
        const s = w.step6 as Step6Data;
        setData({
          will: s.will ?? "",
          must: s.must ?? "",
          can: s.can ?? "",
          loop_description: s.loop_description ?? "",
          ideal_loop: s.ideal_loop ?? "",
        });
      }
      setLoading(false);
    })();
  }, []);

  const save = async (partial: Partial<Step6Data> = data) => {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/workshop/me/step6", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d?.error ?? "保存に失敗しました。");
      return false;
    }
    return true;
  };

  const handleWillMustCanNext = async () => {
    const ok = await save({ will: data.will, must: data.must, can: data.can });
    if (ok) setStep("loop");
  };

  const handleLoopNext = async () => {
    const ok = await save({ loop_description: data.loop_description, ideal_loop: data.ideal_loop });
    if (ok) setStep("done");
  };

  const handleToBlock7 = () => {
    window.location.href = "/workshop/block-7";
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
          <Link href="/workshop/block-5" className="text-community hover:underline">
            ← Block 5
          </Link>
          {" · "}
          STEP 6：資本循環の構造化
        </p>

        {/* 6-A: 導入 */}
        {step === "intro" && (
          <section className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
            <p className="mb-4 leading-relaxed text-stone-700">
              資本の現状が見えましたね。次は、その資本をどう循環させるかを設計します。
            </p>
            <p className="mb-6 leading-relaxed text-stone-700">
              まず「Will（やりたいこと）・Must（やらなければならないこと）・Can（できること）」の3つを整理しましょう。この3つが重なるところに、あなたの「強み×貢献」があります。
            </p>
            <div className="mb-6 rounded-xl border border-stone-200 bg-stone-50 p-4">
              <div className="flex justify-around gap-2 text-center">
                {[
                  { label: "Will", desc: "やりたいこと", color: "#F97316" },           // orange
                  { label: "Must", desc: "やらなければ\nならないこと", color: "#e11d48" }, // rose（警告色として維持）
                  { label: "Can", desc: "できること・\nできるように\nなりたいこと", color: "#3B82F6" }, // blue
                ].map((item) => (
                  <div key={item.label} className="flex flex-col items-center gap-1">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: item.color }}
                    >
                      {item.label}
                    </div>
                    <p className="whitespace-pre-line text-xs text-stone-500">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setStep("will_must_can")}
                className="rounded-xl bg-community px-6 py-3 text-white transition hover:bg-community-light"
              >
                整理を始める
              </button>
            </div>
          </section>
        )}

        {/* 6-B: Will / Must / Can 入力 */}
        {step === "will_must_can" && (
          <section className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
            <h2 className="mb-2 text-lg font-bold text-stone-800">Will / Must / Can の整理</h2>
            <p className="mb-6 text-sm text-stone-500">10年後に向けた、あなた自身の軸を言語化してください。</p>

            <div className="space-y-5">
              <div>
                <label className="mb-1 block text-sm font-bold text-amber-700">
                  Will — やりたいこと
                </label>
                <p className="mb-2 text-xs text-stone-400">10年後に向けて、本当にやりたいことは？</p>
                <textarea
                  rows={3}
                  value={data.will}
                  onChange={(e) => setData((d) => ({ ...d, will: e.target.value }))}
                  className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  placeholder="例：地域の子どもたちに自分の経験を伝えたい、新しい事業を立ち上げたい..."
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-rose-700">
                  Must — やらなければならないこと
                </label>
                <p className="mb-2 text-xs text-stone-400">今の状況で外せない責任・義務は？</p>
                <textarea
                  rows={3}
                  value={data.must}
                  onChange={(e) => setData((d) => ({ ...d, must: e.target.value }))}
                  className="w-full rounded-lg border border-rose-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                  placeholder="例：子どもの学費、親の介護、住宅ローンの返済、今の職場での責任..."
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-blue-700">
                  Can — できること・できるようになりたいこと
                </label>
                <p className="mb-2 text-xs text-stone-400">自分の強み、これから身につけたい能力は？</p>
                <textarea
                  rows={3}
                  value={data.can}
                  onChange={(e) => setData((d) => ({ ...d, can: e.target.value }))}
                  className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="例：人をまとめる力、ファシリテーション、語学、デジタルスキル..."
                />
              </div>
            </div>

            {error && <p className="mt-4 text-sm text-red-600" role="alert">{error}</p>}
            <div className="mt-8 flex justify-end gap-3">
              <button type="button" onClick={() => setStep("intro")} className="rounded-xl border border-stone-300 px-4 py-2 text-stone-600">
                戻る
              </button>
              <button
                type="button"
                onClick={handleWillMustCanNext}
                disabled={saving}
                className="rounded-xl bg-community px-6 py-2 text-white disabled:opacity-60"
              >
                {saving ? "保存中..." : "次へ"}
              </button>
            </div>
          </section>
        )}

        {/* 6-C: ループ構造の記述 */}
        {step === "loop" && (
          <section className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
            <h2 className="mb-2 text-lg font-bold text-stone-800">資本の循環を描く</h2>
            <p className="mb-6 text-sm text-stone-500">
              あなたのワークと資本の流れを言葉で表現しましょう。「〇〇をすることで、□□が増え、それが△△につながる」という形で書いてみてください。
            </p>

            <div className="space-y-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  今のあなたの資本の循環（現状のループ）
                </label>
                <p className="mb-2 text-xs text-stone-400">
                  例：「有償ワークで収入を得る → 生活を維持 → 学習に時間を使えない → 人的資本が伸びにくい」
                </p>
                <textarea
                  rows={4}
                  value={data.loop_description}
                  onChange={(e) => setData((d) => ({ ...d, loop_description: e.target.value }))}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                  placeholder="現状の資本の流れを自由に書いてください..."
                />
              </div>

              <div className="rounded-lg border border-community/30 bg-green-50/40 p-4">
                <p className="text-sm text-stone-700">
                  今の循環に気づけましたか？ 次は、10年後に向けた「理想のループ」を描きましょう。
                  学習ワークが人的資本を増やし、それがギフトワークにつながり、社会資本が育つ——そんな好循環を目指しましょう。
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  10年後の理想の循環（目指すループ）
                </label>
                <p className="mb-2 text-xs text-stone-400">
                  例：「学習ワークで専門性を高める → 社外でのつながりが増える → ギフトワークの機会が生まれる → 社会資本が育つ → さらに学習の動機が高まる」
                </p>
                <textarea
                  rows={4}
                  value={data.ideal_loop}
                  onChange={(e) => setData((d) => ({ ...d, ideal_loop: e.target.value }))}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                  placeholder="10年後に実現したい資本の流れを自由に書いてください..."
                />
              </div>
            </div>

            {error && <p className="mt-4 text-sm text-red-600" role="alert">{error}</p>}
            <div className="mt-8 flex justify-end gap-3">
              <button type="button" onClick={() => setStep("will_must_can")} className="rounded-xl border border-stone-300 px-4 py-2 text-stone-600">
                戻る
              </button>
              <button
                type="button"
                onClick={handleLoopNext}
                disabled={saving}
                className="rounded-xl bg-community px-6 py-2 text-white disabled:opacity-60"
              >
                {saving ? "保存中..." : "確認する"}
              </button>
            </div>
          </section>
        )}

        {/* 6-D: 確認 + ミッチーコメント */}
        {step === "done" && (
          <section className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-lg font-bold text-stone-800">Will / Must / Can と循環の確認</h2>

            <div className="mb-6 space-y-4">
              {[
                { label: "Will", color: "#F97316", value: data.will },   // orange
                { label: "Must", color: "#e11d48", value: data.must },  // rose
                { label: "Can", color: "#3B82F6", value: data.can },    // blue
              ].map(({ label, color, value }) => (
                <div key={label} className="rounded-lg border border-stone-200 p-4">
                  <p className="mb-1 text-xs font-bold" style={{ color }}>{label}</p>
                  <p className="text-sm text-stone-700 whitespace-pre-wrap">{value || "（未入力）"}</p>
                </div>
              ))}
              <div className="rounded-lg border border-stone-200 p-4">
                <p className="mb-1 text-xs font-bold text-stone-500">理想のループ</p>
                <p className="text-sm text-stone-700 whitespace-pre-wrap">{data.ideal_loop || "（未入力）"}</p>
              </div>
            </div>

            <div className="mb-6 rounded-xl border border-community/30 bg-green-50/40 p-5">
              <p className="leading-relaxed text-stone-700">
                素晴らしいビジョンですね。では、そこに向けてPhaseを設計しましょう。
                次のステップでは、5年間の移行計画を具体的に描いていきます。
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setStep("loop")} className="rounded-xl border border-stone-300 px-4 py-2 text-stone-600">
                戻る
              </button>
              <button
                type="button"
                onClick={handleToBlock7}
                className="rounded-xl bg-community px-6 py-3 text-white transition hover:bg-community-light"
              >
                STEP 7 へ進む
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
