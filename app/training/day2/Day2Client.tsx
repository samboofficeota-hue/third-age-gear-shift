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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Portfolio = { future?: PortfolioCircle[]; year?: string; shift?: string };

const MINI_SCALE = 0.62;
const MINI_W = Math.round(660 * MINI_SCALE); // フレーム幅 660 を縮小

/** 比較ステージ用：読み取り専用ポートフォリオを縮小表示（フレーム660×430のみ） */
function MiniPortfolio({
  label,
  year,
  value,
}: {
  label: string;
  year: string;
  value: PortfolioCircle[];
}) {
  const h = Math.round(430 * MINI_SCALE) + 4;
  return (
    <div style={{ width: MINI_W }}>
      <p className="mb-1 text-center text-sm font-bold text-ws-teal">
        {label}
        {year ? `（${year}年）` : ""}
      </p>
      <div style={{ width: MINI_W, height: h, overflow: "hidden" }}>
        <div
          style={{
            transform: `scale(${MINI_SCALE})`,
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

export function Day2Client() {
  const [current, setCurrent] = useState<PortfolioCircle[]>([]); // Day1で作ったもの
  // Day1.bunkai 全体を保持（保存時に portfolio だけ差し替えて shareTable 等を失わない）
  const [day1Bunkai, setDay1Bunkai] = useState<Record<string, unknown>>({});
  const [future, setFuture] = useState<PortfolioCircle[]>([]);
  const [year, setYear] = useState("");
  const [shift, setShift] = useState("");
  const [headerName, setHeaderName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // #8 のステップ：single（現在/未来を切替表示）→ compare（並べてシフト記入）
  const [step, setStep] = useState<"single" | "compare">("single");
  const [which, setWhich] = useState<"current" | "future">("current");

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
        body: JSON.stringify({ portfolio: { future, year, shift } }),
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
    </WorksheetStage>
  );
}
