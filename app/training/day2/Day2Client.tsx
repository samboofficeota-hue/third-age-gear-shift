"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatHeaderName } from "@/components/worksheet/SheetHeader";
import { PrintButton } from "@/components/worksheet/PrintButton";
import { WorksheetStage } from "@/components/worksheet/WorksheetStage";
import { Button } from "@/components/ui/button";
import type { PortfolioCircle } from "@/components/worksheet/CommunityPortfolio";
import {
  EMPTY_ACTION,
  EMPTY_WCM,
  EMPTY_WCM_META,
  EMPTY_SUMMARY,
  EMPTY_BACKCAST,
  type Portfolio,
  type Diagnosis,
  type ActionPlan,
  type ActionTarget,
  type WCM,
  type WcmMeta,
  type Backcast,
  type Summary,
} from "./_types";
import { PortfolioSheet } from "./sheets/PortfolioSheet";
import { DiagnosisSheet } from "./sheets/DiagnosisSheet";
import { ActionPlanSheet } from "./sheets/ActionPlanSheet";
import { BackcastSheet } from "./sheets/BackcastSheet";
import { WcmSheet } from "./sheets/WcmSheet";
import { SummarySheet } from "./sheets/SummarySheet";

/**
 * Day2 オーケストレーター。
 * 役割:
 *  - WorkshopData.day2 全体の load / save（Day1 portfolio も連動保存）
 *  - 操作バー（戻る・閲覧モード表示・印刷ボタン）
 *  - viewOnly の伝搬
 *  - 各シート（#8 自己診断／#9 ポートフォリオ／#10 アクションプラン／#11 WCM／#12 締め）の状態と onChange の橋渡し
 *
 * シートは `app/training/day2/sheets/` に独立。types/constants/helpers は `_types.ts` ほかに切り出し。
 */
export function Day2Client({
  viewOnly = false,
}: { viewOnly?: boolean } = {}) {
  // Day1 由来（現在のポートフォリオ）
  const [current, setCurrent] = useState<PortfolioCircle[]>([]);
  const [day1Bunkai, setDay1Bunkai] = useState<Record<string, unknown>>({});

  // Day2 ステート
  const [future, setFuture] = useState<PortfolioCircle[]>([]);
  const [year, setYear] = useState("");
  const [shift, setShift] = useState<string[]>(["", ""]);
  const [diagnosis, setDiagnosis] = useState<Diagnosis>({});
  const [actionPlan, setActionPlan] = useState<ActionPlan>(EMPTY_ACTION);
  const [wcmCurrent, setWcmCurrent] = useState<WCM>(EMPTY_WCM);
  const [wcmFuture, setWcmFuture] = useState<WCM>(EMPTY_WCM);
  const [wcmMeta, setWcmMeta] = useState<WcmMeta>(EMPTY_WCM_META);
  const [backcast, setBackcast] = useState<Backcast>(EMPTY_BACKCAST);
  const [summary, setSummary] = useState<Summary>(EMPTY_SUMMARY);

  // 宿題のみらいシナリオ（読み取り専用で表示。修正はモーダルで完結）
  const [societyScenario, setSocietyScenario] = useState<
    Record<string, string>
  >({});
  const [companyScenario, setCompanyScenario] = useState<
    Record<string, string>
  >({});

  // 表示・保存系
  const [headerName, setHeaderName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // ステップ系
  const [step, setStep] = useState<"single" | "compare">("compare");
  const [which, setWhich] = useState<"current" | "future">("current");
  // 「現在」ボックスの読み込み表示フラグ。compare ⇄ single の行き来で
  // PortfolioSheet 内部が再マウントされてもリセットされないよう、ここで保持する
  const [currentLoaded, setCurrentLoaded] = useState(false);
  const [wcmStep, setWcmStep] = useState<"current" | "both">("current");

  // 任意の onChange に「保存マークを倒す」処理を挟むラッパ群
  const dirty = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setSaved(false);
  };

  const handleShiftItemChange = (i: number, v: string) => {
    setShift((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
    setSaved(false);
  };
  const handleShiftAdd = () => {
    setShift((prev) => (prev.length >= 4 ? prev : [...prev, ""]));
    setSaved(false);
  };

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
      const rawShift = pf?.shift;
      setShift(
        Array.isArray(rawShift) && rawShift.length > 0
          ? rawShift
          : typeof rawShift === "string" && rawShift
            ? [rawShift]
            : ["", ""]
      );
      const hwScenario = d?.workshopData?.homework?.scenario as
        | { company?: Record<string, string>; society?: Record<string, string> }
        | undefined;
      setSocietyScenario(hwScenario?.society ?? {});
      setCompanyScenario(hwScenario?.company ?? {});
      setDiagnosis((d?.workshopData?.day2?.diagnosis as Diagnosis) ?? {});
      // 旧A/B2枠形式のデータも読める形で吸収する（対象1つ形式へ移行）
      const apRaw = d?.workshopData?.day2?.actionPlan as
        | (Partial<ActionPlan> & {
            targetA?: string;
            A?: Partial<ActionTarget>;
          })
        | undefined;
      setActionPlan({
        target: apRaw?.target ?? apRaw?.targetA ?? "",
        why: apRaw?.why ?? apRaw?.A?.why ?? "",
        with: apRaw?.with ?? apRaw?.A?.with ?? "",
        what: apRaw?.what ?? apRaw?.A?.what ?? "",
        sowhat: apRaw?.sowhat ?? apRaw?.A?.sowhat ?? "",
      });
      const wcm = d?.workshopData?.day2?.wcm as
        | { current?: WCM; future?: WCM; meta?: WcmMeta }
        | undefined;
      setWcmCurrent({ ...EMPTY_WCM, ...(wcm?.current ?? {}) });
      setWcmFuture({ ...EMPTY_WCM, ...(wcm?.future ?? {}) });
      setWcmMeta({ ...EMPTY_WCM_META, ...(wcm?.meta ?? {}) });
      setBackcast({
        ...EMPTY_BACKCAST,
        ...((d?.workshopData?.day2?.backcast as Backcast) ?? {}),
      });
      setSummary({
        ...EMPTY_SUMMARY,
        ...((d?.workshopData?.day2?.summary as Summary) ?? {}),
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
      // 現在＝Day1 のマイ・ポートフォリオ。bunkai 全体を保ったまま portfolio だけ差し替え
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
          backcast,
          wcm: { current: wcmCurrent, future: wcmFuture, meta: wcmMeta },
          summary,
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

  return (
    <WorksheetStage>
      {/* 操作バー：編集モードは戻りリンクなし（ヘッダーの「ガイドに戻る」に一本化）。
          閲覧モード（事後の記録閲覧）のときだけ、記録一覧への戻り導線とバッジ／PDFを出す。 */}
      {viewOnly && (
        <div className="no-print flex w-full max-w-[1123px] items-center justify-between gap-3">
          <Link
            href="/workshop/records"
            className="inline-flex items-center gap-1.5 text-sm text-ws-muted hover:text-ws-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            ワークの記録 一覧へ
          </Link>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-ws-teal/30 bg-ws-mint/40 px-4 py-2 text-sm font-medium text-ws-teal">
              閲覧モード（書き込みはできません）
            </span>
            <PrintButton />
          </div>
        </div>
      )}

      {/* #8 コミュニティ活動力 自己診断 */}
      <DiagnosisSheet
        nameTag={nameTag}
        diagnosis={diagnosis}
        viewOnly={viewOnly}
        onDiagnosisChange={dirty(setDiagnosis)}
      />

      {/* #9 マイ・ポートフォリオ 2.0 → 3.0 */}
      <PortfolioSheet
        nameTag={nameTag}
        step={step}
        which={which}
        current={current}
        future={future}
        year={year}
        shift={shift}
        viewOnly={viewOnly}
        saved={saved}
        saving={saving}
        currentLoaded={currentLoaded}
        onCurrentLoadedChange={setCurrentLoaded}
        onStepChange={setStep}
        onWhichChange={setWhich}
        onCurrentChange={dirty(setCurrent)}
        onFutureChange={dirty(setFuture)}
        onYearChange={dirty(setYear)}
        onShiftItemChange={handleShiftItemChange}
        onShiftAdd={handleShiftAdd}
        onSave={save}
      />

      {/* #10 ポートフォリオ戦略 アクションプラン */}
      <ActionPlanSheet
        nameTag={nameTag}
        actionPlan={actionPlan}
        viewOnly={viewOnly}
        onActionPlanChange={dirty(setActionPlan)}
      />

      {/* #10 社会における バックキャスト */}
      <BackcastSheet
        nameTag={nameTag}
        societyScenario={societyScenario}
        backcast={backcast}
        viewOnly={viewOnly}
        onBackcastChange={dirty(setBackcast)}
        onSocietyScenarioChange={setSocietyScenario}
      />

      {/* #11 会社での Will/Can/Must 2.0 → 3.0 */}
      <WcmSheet
        nameTag={nameTag}
        wcmStep={wcmStep}
        wcmCurrent={wcmCurrent}
        wcmFuture={wcmFuture}
        wcmMeta={wcmMeta}
        viewOnly={viewOnly}
        companyScenario={companyScenario}
        onCompanyScenarioChange={setCompanyScenario}
        onWcmStepChange={setWcmStep}
        onWcmCurrentChange={dirty(setWcmCurrent)}
        onWcmFutureChange={dirty(setWcmFuture)}
        onWcmMetaChange={dirty(setWcmMeta)}
      />

      {/* #12 課題・目標・行動 設定 ＋ 締め */}
      <SummarySheet
        nameTag={nameTag}
        summary={summary}
        viewOnly={viewOnly}
        onSummaryChange={dirty(setSummary)}
      />

      {/* 保存（右下フロート・Day2全体を保存） */}
      {!viewOnly && (
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
      )}
    </WorksheetStage>
  );
}
