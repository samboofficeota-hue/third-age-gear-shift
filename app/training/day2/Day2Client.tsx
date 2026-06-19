"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PrintSheet } from "@/components/worksheet/PrintSheet";
import { SheetHeader, formatHeaderName } from "@/components/worksheet/SheetHeader";
import { PrintButton } from "@/components/worksheet/PrintButton";
import { WorksheetStage } from "@/components/worksheet/WorksheetStage";
import {
  CommunityPortfolio,
  type PortfolioCircle,
} from "@/components/worksheet/CommunityPortfolio";
import { RadarChart } from "@/components/worksheet/RadarChart";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Portfolio = { future?: PortfolioCircle[]; year?: string; shift?: string };
type Diagnosis = Record<number, number>; // No → 合計スコア（1〜10）
type ActionTarget = { why: string; with: string; what: string; sowhat: string };
type ActionPlan = {
  targetA: string;
  targetB: string;
  A: ActionTarget;
  B: ActionTarget;
};
const EMPTY_TARGET: ActionTarget = { why: "", with: "", what: "", sowhat: "" };
const EMPTY_ACTION: ActionPlan = {
  targetA: "",
  targetB: "",
  A: EMPTY_TARGET,
  B: EMPTY_TARGET,
};

const SCORE_MAX = 12; // レーダーチャートの軸最大
const CIRCLED = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"];

const DIAGNOSIS_ITEMS: {
  no: number;
  cat: string;
  span: number; // カテゴリーセルの rowSpan（グループ先頭のみ>0）
  name: string;
  desc: string;
}[] = [
  { no: 1, cat: "自己理解力", span: 3, name: "Will理解", desc: "自分のやりたいことやワクワク・情熱について理解している" },
  { no: 2, cat: "", span: 0, name: "Can理解", desc: "自分の強みや得意、力の発揮どころについて理解している" },
  { no: 3, cat: "", span: 0, name: "Must理解", desc: "自分に求められる役割や期待について理解している" },
  { no: 4, cat: "自分らしさ力", span: 4, name: "個性発揮力", desc: "集団の中で違う状態でいる力。他のメンバーに合わせすぎず個性を発揮する力" },
  { no: 5, cat: "", span: 0, name: "自己開示力", desc: "自分のことをオープンに話せる力。自分のことを適切に語ってまわりに共有する力" },
  { no: 6, cat: "", span: 0, name: "援助希求力", desc: "困った時や悩んでいるときに誰かに頼れる力。自分の弱さも他者と共有できる力" },
  { no: 7, cat: "", span: 0, name: "距離確保力", desc: "自分がつらく感じたときに、状況に応じてコミュニティやメンバーと距離を置く力" },
  { no: 8, cat: "環境適応力", span: 3, name: "傾聴力", desc: "他者の話をしっかりと聴く力。相手の気持ちに寄り添い、共感的理解や関心を示す力" },
  { no: 9, cat: "", span: 0, name: "他者受容力", desc: "相手の個性や存在をあたたかく受け容れる力。包括的にまるごと受け容れる力" },
  { no: 10, cat: "", span: 0, name: "多様性許容力", desc: "違いを認めて尊重する力。共感・同意できないものがあっても尊重する姿勢" },
];

const MINI_SCALE = 0.62;
const MINI_W = Math.round(660 * MINI_SCALE); // フレーム幅 660 を縮小

/** 読み取り専用ポートフォリオを縮小表示（フレーム660×430のみ） */
function MiniPortfolio({
  label,
  year,
  value,
  scale = MINI_SCALE,
}: {
  label: string;
  year: string;
  value: PortfolioCircle[];
  scale?: number;
}) {
  const w = Math.round(660 * scale);
  const h = Math.round(430 * scale) + 4;
  return (
    <div style={{ width: w }}>
      <p className="mb-1 text-center text-sm font-bold text-ws-teal">
        {label}
        {year ? `（${year}年）` : ""}
      </p>
      <div style={{ width: w, height: h, overflow: "hidden" }}>
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            width: 660,
          }}
        >
          {/* CommunityPortfolio の mt-6 を相殺してフレーム上端から表示 */}
          <div className="-mt-6">
            <CommunityPortfolio value={value} readOnly />
          </div>
        </div>
      </div>
    </div>
  );
}

/** アクションプランの記入ボックス（Why/With/What/So What 共通） */
function ActionBox({
  label,
  value,
  onChange,
  ph,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  ph: string;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-bold text-ws-teal">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={6}
        placeholder={ph}
        className="w-full resize-none rounded-md border border-ws-line px-3 py-2 text-base leading-relaxed text-ws-ink outline-none placeholder:text-ws-muted/50 focus:border-ws-teal"
      />
    </div>
  );
}

export function Day2Client() {
  const [current, setCurrent] = useState<PortfolioCircle[]>([]); // Day1で作ったもの
  // Day1.bunkai 全体を保持（保存時に portfolio だけ差し替えて shareTable 等を失わない）
  const [day1Bunkai, setDay1Bunkai] = useState<Record<string, unknown>>({});
  const [future, setFuture] = useState<PortfolioCircle[]>([]);
  const [year, setYear] = useState("");
  const [shift, setShift] = useState("");
  const [diagnosis, setDiagnosis] = useState<Diagnosis>({});
  const [actionPlan, setActionPlan] = useState<ActionPlan>(EMPTY_ACTION);
  const [headerName, setHeaderName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // #8 のステップ：single（現在/未来を切替表示）→ compare（並べてシフト記入）
  const [step, setStep] = useState<"single" | "compare">("single");
  const [which, setWhich] = useState<"current" | "future">("current");
  // #9 自己診断：表入力 ↔ レーダーチャート
  const [diagView, setDiagView] = useState<"table" | "chart">("table");
  // #10 アクションプラン：対象選定 ↔ 記入
  const [apStep, setApStep] = useState<"select" | "entry">("select");

  useEffect(() => {
    (async () => {
      const d = await fetch("/api/workshop/me", { credentials: "include" })
        .then((r) => r.json())
        .catch(() => ({}));
      const ps = d?.workshopData?.pre?.profileSlide as
        | { name?: string; nickname?: string }
        | undefined;
      setHeaderName(
        formatHeaderName(
          (ps?.name ?? d?.account?.name ?? "").trim(),
          (ps?.nickname ?? "").trim()
        )
      );
      const bunkai = (d?.workshopData?.day1?.bunkai ?? {}) as Record<
        string,
        unknown
      > & { portfolio?: PortfolioCircle[] };
      setDay1Bunkai(bunkai);
      setCurrent(bunkai?.portfolio ?? []);
      const pf = d?.workshopData?.day2?.portfolio as Portfolio | undefined;
      setFuture(pf?.future ?? []);
      setYear(pf?.year ?? "");
      setShift(pf?.shift ?? "");
      setDiagnosis((d?.workshopData?.day2?.diagnosis as Diagnosis) ?? {});
      const ap = d?.workshopData?.day2?.actionPlan as ActionPlan | undefined;
      setActionPlan({
        targetA: ap?.targetA ?? "",
        targetB: ap?.targetB ?? "",
        A: { ...EMPTY_TARGET, ...(ap?.A ?? {}) },
        B: { ...EMPTY_TARGET, ...(ap?.B ?? {}) },
      });
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 3000);
    return () => clearTimeout(t);
  }, [saved]);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      // 現在＝Day1のマイ・ポートフォリオ。編集を Day1 に保存（bunkai 全体を維持）
      const day1Res = await fetch("/api/workshop/me/day1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ bunkai: { ...day1Bunkai, portfolio: current } }),
      });
      const day2Res = await fetch("/api/workshop/me/day2", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          portfolio: { future, year, shift },
          diagnosis,
          actionPlan,
        }),
      });
      if (day1Res.ok && day2Res.ok) setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-ws-muted">読み込み中...</p>
      </div>
    );
  }

  const nameTag = headerName ? (
    <span className="text-base font-bold text-ws-ink">{headerName}</span>
  ) : null;

  // #10 各対象（A／B）の記入シート（Why/With/What/So What）
  const targetSheet = (tk: "A" | "B") => {
    const t = actionPlan[tk];
    const name = tk === "A" ? actionPlan.targetA : actionPlan.targetB;
    const set = (field: keyof ActionTarget, v: string) => {
      setActionPlan({ ...actionPlan, [tk]: { ...t, [field]: v } });
      setSaved(false);
    };
    return (
      <PrintSheet>
        <div className="flex items-start justify-between gap-4 pt-3">
          <SheetHeader
            no={10}
            accent="ポートフォリオ戦略"
            title="アクションプラン"
          />
          {nameTag}
        </div>
        <div className="mt-10 flex items-center gap-3">
          <span className="rounded bg-[#FCEFA6] px-3 py-1 text-base font-bold text-ws-ink">
            対象（{tk}）
          </span>
          <span className="text-3xl font-bold text-ws-ink">
            {name || "（未選定）"}
          </span>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-x-10 gap-y-8">
          <ActionBox
            label="#1 Why ― 何のために"
            value={t.why}
            onChange={(v) => set("why", v)}
            ph="このコミュニティに関わる目的は？"
          />
          <ActionBox
            label="#3 What ― 何をやってみる"
            value={t.what}
            onChange={(v) => set("what", v)}
            ph="具体的にやってみることは？"
          />
          <ActionBox
            label="#2 With ― 誰と一緒に"
            value={t.with}
            onChange={(v) => set("with", v)}
            ph="誰と一緒にやる？"
          />
          <ActionBox
            label="#4 So What ― 結果どうなりたい"
            value={t.sowhat}
            onChange={(v) => set("sowhat", v)}
            ph="その先、どうなっていたい？"
          />
        </div>
      </PrintSheet>
    );
  };

  return (
    <WorksheetStage>
      {/* 操作バー */}
      <div className="no-print flex w-full max-w-[1123px] items-center justify-between gap-3">
        <Link
          href="/training"
          className="inline-flex items-center gap-1.5 text-sm text-ws-muted hover:text-ws-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          研修本番へ戻る
        </Link>
        <PrintButton />
      </div>

      <PrintSheet>
        <SheetHeader
          no={8}
          accent="マイ・ポートフォリオ"
          title="戦略 2.0 → 3.0"
          right={nameTag}
        />
        <div className="mt-3 flex items-start justify-between gap-6">
          <p className="text-sm text-ws-muted">
            何に時間を費やしていきたいか。どんなポートフォリオを描きたいか。まずはドラフト案をつくろう。
          </p>
          {/* ステップ切替ボタン */}
          <div className="no-print flex shrink-0 items-center gap-2">
            {step === "single" ? (
              <>
                {(["current", "future"] as const).map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setWhich(w)}
                    className={cn(
                      "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                      which === w
                        ? "border-ws-teal bg-ws-mint text-ws-teal"
                        : "border-ws-line text-ws-muted hover:text-ws-ink"
                    )}
                  >
                    {w === "current" ? "現在" : "未来"}
                  </button>
                ))}
                <Button
                  onClick={() => setStep("compare")}
                  className="rounded-full px-4"
                >
                  次に進む →
                </Button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setStep("single")}
                  className="rounded-full border border-ws-line px-4 py-1.5 text-sm font-medium text-ws-muted hover:text-ws-ink"
                >
                  ← 前に戻る
                </button>
                {saved && (
                  <span className="text-sm font-medium text-ws-teal">
                    保存しました ✓
                  </span>
                )}
                <Button
                  onClick={save}
                  disabled={saving}
                  className="rounded-full px-5"
                >
                  {saving ? "保存中..." : "保存する"}
                </Button>
              </>
            )}
          </div>
        </div>

        {step === "single" ? (
          which === "current" ? (
            <div>
              <p className="mt-5 inline-block rounded bg-ws-mint px-3 py-1 text-base font-bold text-ws-teal">
                現在（2026年）のマイ・ポートフォリオ ＝ Day1で作成
              </p>
              <CommunityPortfolio
                value={current}
                onChange={(next) => {
                  setCurrent(next);
                  setSaved(false);
                }}
              />
            </div>
          ) : (
            <div>
              <div className="mt-5 flex items-center gap-3">
                <span className="inline-block rounded bg-ws-mint px-3 py-1 text-base font-bold text-ws-teal">
                  未来のポートフォリオ ＝ これから描く
                </span>
                <span className="no-print inline-flex items-center gap-1 text-sm text-ws-muted">
                  <input
                    value={year}
                    onChange={(e) => {
                      setYear(e.target.value);
                      setSaved(false);
                    }}
                    placeholder="20xx"
                    className="w-20 rounded-md border border-ws-line px-2 py-1 text-center text-ws-ink outline-none focus:border-ws-teal"
                  />
                  年
                </span>
              </div>
              <CommunityPortfolio
                value={future}
                onChange={(next) => {
                  setFuture(next);
                  setSaved(false);
                }}
              />
            </div>
          )
        ) : (
          <div className="mt-5 mx-auto" style={{ width: MINI_W * 2 + 88 }}>
            {/* 現在 ／ 未来 を間隔をあけて並べて比較（左右端 = テキスト欄の両端） */}
            <div className="flex justify-between">
              <MiniPortfolio label="現在" year="2026" value={current} />
              <MiniPortfolio label="未来" year={year} value={future} />
            </div>
            {/* シフト記入（見出しは中央・図の下端から少し下げる） */}
            <p className="mt-8 text-center">
              <span className="inline-block rounded bg-ws-mint px-3 py-1 text-base font-bold text-ws-teal">
                シフト ＝ 現在から未来への移行ポイント
              </span>
            </p>
            <textarea
              value={shift}
              onChange={(e) => {
                setShift(e.target.value);
                setSaved(false);
              }}
              rows={4}
              placeholder="現在から未来へ。何からシフトしていく？ どうシフトしていく？"
              className="mt-3 w-full resize-none rounded-md border border-ws-line px-3 py-2 text-base leading-relaxed text-ws-ink outline-none placeholder:text-ws-muted/50 focus:border-ws-teal"
            />
          </div>
        )}
      </PrintSheet>

      {/* ── #9 コミュニティ活動力 〜 自己診断 ── */}
      <PrintSheet>
        <SheetHeader
          no={9}
          accent="コミュニティ活動力"
          title="〜 自己診断"
          right={nameTag}
        />
        <div className="mt-3 flex items-start justify-between gap-6">
          <p className="text-sm text-ws-muted">
            マイ・ポートフォリオを広げていくためには、自分のチカラを知るところから始めましょう。診断サイトの合計スコア（1〜10）を入力してください。
          </p>
          <div className="no-print flex shrink-0 items-center gap-1.5">
            {(["table", "chart"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setDiagView(v)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  diagView === v
                    ? "border-ws-teal bg-ws-mint text-ws-teal"
                    : "border-ws-line text-ws-muted hover:text-ws-ink"
                )}
              >
                {v === "table" ? "入力する" : "グラフで見る"}
              </button>
            ))}
          </div>
        </div>

        {diagView === "chart" ? (
          <div className="mt-4 flex items-center justify-center gap-16">
            {/* 合計スコア表（大項目／中項目／合計スコア） */}
            <table className="shrink-0 border-collapse text-sm">
              <thead>
                <tr className="bg-ws-teal text-white">
                  <th className="border border-ws-teal px-3 py-2 font-semibold">大項目</th>
                  <th className="border border-ws-teal px-3 py-2 font-semibold">中項目</th>
                  <th className="border border-ws-teal px-3 py-2 font-semibold">合計スコア</th>
                </tr>
              </thead>
              <tbody>
                {DIAGNOSIS_ITEMS.map((it) => (
                  <tr key={it.no}>
                    {it.span > 0 && (
                      <td
                        rowSpan={it.span}
                        className="border border-ws-line px-3 py-1.5 text-center align-middle font-bold text-ws-ink"
                      >
                        {it.cat}
                      </td>
                    )}
                    <td className="border border-ws-line px-3 py-1.5 font-bold text-ws-ink">
                      {CIRCLED[it.no - 1]} {it.name}
                    </td>
                    <td className="border border-ws-line px-3 py-1.5 text-center text-base font-bold text-ws-teal">
                      {diagnosis[it.no] ?? "–"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* レーダーチャート */}
            <div className="w-[470px] max-w-full">
              <RadarChart
                items={DIAGNOSIS_ITEMS.map((it) => ({
                  label: `${CIRCLED[it.no - 1]} ${it.name}`,
                  value: Number(diagnosis[it.no] ?? 0),
                }))}
                max={SCORE_MAX}
              />
            </div>
          </div>
        ) : (
        <table className="mt-3 w-full border-collapse text-sm">
          <thead>
            <tr className="bg-ws-teal text-white">
              <th className="border border-ws-teal px-2 py-2 font-semibold">No</th>
              <th className="border border-ws-teal px-2 py-2 font-semibold">
                カテゴリー
              </th>
              <th className="border border-ws-teal px-2 py-2 font-semibold">
                活動力
              </th>
              <th className="border border-ws-teal px-3 py-2 text-left font-semibold">
                解説
              </th>
              <th className="border border-ws-teal px-2 py-2 font-semibold">評価</th>
            </tr>
          </thead>
          <tbody>
            {DIAGNOSIS_ITEMS.map((it) => (
              <tr key={it.no}>
                <td className="border border-ws-line px-2 py-1.5 text-center text-ws-muted">
                  {it.no}
                </td>
                {it.span > 0 && (
                  <td
                    rowSpan={it.span}
                    className="border border-ws-line px-2 py-1.5 text-center align-middle font-bold text-ws-ink"
                  >
                    {it.cat}
                  </td>
                )}
                <td className="border border-ws-line px-2 py-1.5 text-center font-bold text-ws-teal">
                  {it.name}
                </td>
                <td className="border border-ws-line px-3 py-1.5 leading-snug text-ws-ink">
                  {it.desc}
                </td>
                <td className="border border-ws-line px-2 py-1.5 text-center">
                  <input
                    type="number"
                    min={1}
                    max={SCORE_MAX}
                    value={diagnosis[it.no] ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      const next = { ...diagnosis };
                      if (v === "") delete next[it.no];
                      else next[it.no] = Number(v);
                      setDiagnosis(next);
                      setSaved(false);
                    }}
                    placeholder="–"
                    className="w-16 rounded-md border border-ws-line px-2 py-1 text-center text-base font-bold text-ws-ink outline-none placeholder:font-normal placeholder:text-ws-muted/50 focus:border-ws-teal"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </PrintSheet>

      {/* ── #10 ポートフォリオ戦略 アクションプラン ── */}
      {apStep === "select" ? (
      <PrintSheet>
        <div className="flex items-start justify-between gap-4">
          <SheetHeader
            no={10}
            accent="ポートフォリオ戦略"
            title="アクションプラン"
          />
          {nameTag}
        </div>
        <div className="mt-3 flex items-start justify-between gap-6">
          <p className="text-sm text-ws-muted">
            未来のマイ・ポートフォリオから、コミュニティを2つ選定して、具体的な「一歩目」づくりを考えていきましょう。
          </p>
          <Button
            onClick={() => setApStep("entry")}
            className="no-print shrink-0 rounded-full px-4"
          >
            次に進む →
          </Button>
        </div>
        <div className="mt-5 flex items-center gap-10">
          {/* 左：未来図（大きめ・文字が読めるサイズ） */}
          <div className="shrink-0">
            <MiniPortfolio label="未来" year={year} value={future} scale={0.92} />
          </div>
          {/* 右：対象A／対象B の選定 */}
          <div className="flex-1 space-y-6">
            {(["A", "B"] as const).map((tk) => (
              <div key={tk}>
                <span className="mb-2 flex items-center gap-2 text-base font-bold text-ws-ink">
                  <span className="rounded bg-[#FCEFA6] px-2.5 py-0.5">
                    対象（{tk}）
                  </span>
                  <span className="text-sm font-normal text-ws-muted">
                    どのコミュニティ
                  </span>
                </span>
                <input
                  value={tk === "A" ? actionPlan.targetA : actionPlan.targetB}
                  onChange={(e) => {
                    setActionPlan({
                      ...actionPlan,
                      [tk === "A" ? "targetA" : "targetB"]: e.target.value,
                    });
                    setSaved(false);
                  }}
                  placeholder="未来のポートフォリオから1つ"
                  className="w-full rounded-md border border-ws-line px-3 py-2 text-base text-ws-ink outline-none placeholder:text-ws-muted/50 focus:border-ws-teal"
                />
              </div>
            ))}
          </div>
        </div>
      </PrintSheet>
      ) : (
        <>
          {/* 戻る操作（記入ステップ） */}
          <div className="no-print flex w-full max-w-[1123px] justify-end">
            <button
              type="button"
              onClick={() => setApStep("select")}
              className="rounded-full border border-ws-line px-4 py-1.5 text-sm font-medium text-ws-muted hover:text-ws-ink"
            >
              ← 対象の選定に戻る
            </button>
          </div>
          {targetSheet("A")}
          {targetSheet("B")}
        </>
      )}

      {/* 保存（右下フロート・Day2全体を保存） */}
      <div className="no-print fixed bottom-6 right-6 z-50 flex items-center gap-3">
        {saved && (
          <span className="rounded-full bg-white/95 px-3 py-1.5 text-sm font-medium text-ws-teal shadow-md ring-1 ring-ws-line">
            保存しました ✓
          </span>
        )}
        <Button
          onClick={save}
          disabled={saving}
          className="rounded-full px-6 shadow-lg"
        >
          {saving ? "保存中..." : "保存する"}
        </Button>
      </div>
    </WorksheetStage>
  );
}
