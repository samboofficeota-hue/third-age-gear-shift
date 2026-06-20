"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PrintSheet } from "@/components/worksheet/PrintSheet";
import { SheetHeader, formatHeaderName } from "@/components/worksheet/SheetHeader";
import { PrintButton } from "@/components/worksheet/PrintButton";
import { WorksheetStage } from "@/components/worksheet/WorksheetStage";
import {
  FillBlankScenario,
  type FillTemplate,
} from "@/components/worksheet/FillBlankScenario";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Blanks = Record<string, string>;
type Scenario = { company?: Blanks; society?: Blanks };

const COMPANY_TEMPLATE: FillTemplate = [
  [
    { text: "私は " },
    { blank: "age", w: "sm", ph: "歳" },
    { text: " 歳まで、この会社で走り切ると決めた。" },
  ],
  [
    { text: "自分自身は以前と変わらないつもりだが、" },
    { blank: "change", w: "md", ph: "どんな変化" },
    { text: " という変化は起きているだろう。" },
  ],
  [
    { text: "でも、私は " },
    { blank: "doit", w: "lg", ph: "やりきりたいこと" },
    { text: " をやりきりたい。" },
  ],
  [
    { text: "これは、" },
    { blank: "who", w: "md", ph: "誰" },
    { text: " の " },
    { blank: "challenge", w: "lg", ph: "課題" },
    { text: " という課題に応えるもの。" },
  ],
  [
    { text: "私の " },
    { blank: "power", w: "md", ph: "強み・力" },
    { text: " という力がいちばん活きてくるはずだ。" },
  ],
  [
    { blank: "endYear", w: "sm", ph: "年" },
    { text: " 年、私がこの会社での役割を終えるとき、" },
  ],
  [
    { text: "私は、" },
    { blank: "legacy", w: "md", ph: "何" },
    { text: " を " },
    { blank: "successor", w: "md", ph: "誰" },
    { text: " に託していく。" },
  ],
];

const SOCIETY_TEMPLATE: FillTemplate = [
  [
    { text: "2045年、" },
    { blank: "age", w: "sm", ph: "歳" },
    { text: " 歳の私は、今日も " },
    { blank: "activity", w: "md", ph: "活動" },
    { text: " に取り組んでいる。" },
  ],
  [
    { text: "会社員の頃、" },
    { blank: "issue", w: "lg", ph: "社会の課題" },
    { text: " という社会の課題を感じていた。" },
  ],
  [
    { text: "ただあの頃の私は、" },
    { blank: "excuse", w: "lg", ph: "言い訳・思い込み" },
    { text: " と思い、何もせずにいた。" },
  ],
  [{ text: "でも、やってみたら夢中になった。" }],
  [
    { text: "そして何より " },
    { blank: "fulfill", w: "lg", ph: "実感" },
    { text: " という実感がある。" },
  ],
  [
    { text: "私の " },
    { blank: "power", w: "md", ph: "強み・力" },
    { text: " という力が、" },
    { blank: "forWhom", w: "md", ph: "誰・何" },
    { text: " のために活かせている。" },
  ],
  [{ text: "もうちょっと早く始めておけばよかった。" }],
  [
    { text: "だから、2026年の私に伝えたい！「" },
    { blank: "message", w: "lg", ph: "メッセージ" },
    { text: "」だと。" },
  ],
];

const MODES = [
  { key: "edit", label: "記入する" },
  { key: "preview", label: "文章で見る" },
  { key: "sample", label: "記入例を見る" },
] as const;
type Mode = (typeof MODES)[number]["key"];

export function HomeworkClient({
  viewOnly = false,
}: { viewOnly?: boolean } = {}) {
  const [company, setCompany] = useState<Blanks>({});
  const [society, setSociety] = useState<Blanks>({});
  const [headerName, setHeaderName] = useState("");
  const [companyMode, setCompanyMode] = useState<Mode>("edit");
  const [societyMode, setSocietyMode] = useState<Mode>("edit");
  const [example, setExample] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
      const sc = d?.workshopData?.homework?.scenario as Scenario | undefined;
      setCompany(sc?.company ?? {});
      setSociety(sc?.society ?? {});
      setLoading(false);
    })();
  }, []);

  // 記入例（DEMOアカウントの実データ）を初回の「記入例を見る」で取得
  useEffect(() => {
    if ((companyMode !== "sample" && societyMode !== "sample") || example) return;
    (async () => {
      const d = await fetch("/api/workshop/example", { credentials: "include" })
        .then((r) => r.json())
        .catch(() => ({}));
      setExample((d?.example?.homework?.scenario ?? {}) as Scenario);
    })();
  }, [companyMode, societyMode, example]);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 3000);
    return () => clearTimeout(t);
  }, [saved]);

  const companyDisplay = viewOnly || companyMode !== "edit" ? "display" : "edit";
  const societyDisplay = viewOnly || societyMode !== "edit" ? "display" : "edit";
  const companyVal =
    !viewOnly && companyMode === "sample" ? example?.company ?? {} : company;
  const societyVal =
    !viewOnly && societyMode === "sample" ? example?.society ?? {} : society;
  const anyEditing =
    !viewOnly && (companyMode === "edit" || societyMode === "edit");

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/workshop/me/homework", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ scenario: { company, society } }),
      });
      if (res.ok) setSaved(true);
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

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <span className="inline-block rounded bg-ws-mint px-3 py-1 text-base font-bold text-ws-teal">
      {children}
    </span>
  );

  // 編集/表示の切替（小さめ・各シートの説明行の右に置く・シートごと独立）
  const ModeToggle = ({
    mode,
    setMode,
  }: {
    mode: Mode;
    setMode: (m: Mode) => void;
  }) => (
    <div className="no-print flex shrink-0 items-center gap-1.5">
      {MODES.map((m) => (
        <button
          key={m.key}
          type="button"
          onClick={() => setMode(m.key)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            mode === m.key
              ? "border-ws-teal bg-ws-mint text-ws-teal"
              : "border-ws-line text-ws-muted hover:text-ws-ink"
          )}
        >
          {m.label}
        </button>
      ))}
    </div>
  );

  const intro =
    "会社と社会。2つの軸で「こうなっているかも」という未来を描いてみましょう。基本は妄想です！";

  return (
    <WorksheetStage>
      {/* 操作バー（戻る＋PDF。編集/表示の切替は各シートの説明行右に配置） */}
      <div className="no-print flex w-full max-w-[1123px] items-center justify-between gap-3">
        <Link
          href={viewOnly ? "/workshop/records" : "/training"}
          className="inline-flex items-center gap-1.5 text-sm text-ws-muted hover:text-ws-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          {viewOnly ? "ワークの記録 一覧へ" : "研修本番へ戻る"}
        </Link>
        <div className="flex items-center gap-2">
          {viewOnly && (
            <span className="rounded-full border border-ws-teal/30 bg-ws-mint/40 px-4 py-2 text-sm font-medium text-ws-teal">
              閲覧モード（書き込みはできません）
            </span>
          )}
          <PrintButton />
        </div>
      </div>

      {/* #1 会社編 */}
      <PrintSheet>
        <SheetHeader
          no={7}
          accent="みらい"
          title="シナリオ"
          sub="〜 20xx年のじぶんを妄想する"
          right={nameTag}
        />
        <div className="mt-3 flex items-start justify-between gap-6">
          <p className="text-sm text-ws-muted">{intro}</p>
          {!viewOnly && <ModeToggle mode={companyMode} setMode={setCompanyMode} />}
        </div>
        <div className="mt-5">
          <SectionLabel>#1 COMPANY（会社編）</SectionLabel>
        </div>
        <FillBlankScenario
          template={COMPANY_TEMPLATE}
          values={companyVal}
          onChange={setCompanyDirty}
          mode={companyDisplay}
        />
      </PrintSheet>

      {/* #2 社会編 */}
      <PrintSheet>
        <SheetHeader
          no={7}
          accent="みらい"
          title="シナリオ"
          sub="〜 20xx年のじぶんを妄想する"
          right={nameTag}
        />
        <div className="mt-3 flex items-start justify-between gap-6">
          <p className="text-sm text-ws-muted">{intro}</p>
          {!viewOnly && <ModeToggle mode={societyMode} setMode={setSocietyMode} />}
        </div>
        <div className="mt-5">
          <SectionLabel>#2 SOCIETY（社会編）</SectionLabel>
        </div>
        <FillBlankScenario
          template={SOCIETY_TEMPLATE}
          values={societyVal}
          onChange={setSocietyDirty}
          mode={societyDisplay}
        />
      </PrintSheet>

      {/* 保存（右下フロート・どちらかが記入中のとき表示） */}
      {anyEditing && (
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

  function setCompanyDirty(next: Blanks) {
    setCompany(next);
    setSaved(false);
  }
  function setSocietyDirty(next: Blanks) {
    setSociety(next);
    setSaved(false);
  }
}
