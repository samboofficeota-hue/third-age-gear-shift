"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PrintSheet } from "@/components/worksheet/PrintSheet";
import { SheetHeader, formatHeaderName } from "@/components/worksheet/SheetHeader";
import { PrintButton } from "@/components/worksheet/PrintButton";
import { WorksheetStage } from "@/components/worksheet/WorksheetStage";
import { HomeworkSaveBar } from "@/components/worksheet/HomeworkSaveBar";
import {
  FillBlankScenario,
  type FillTemplate,
} from "@/components/worksheet/FillBlankScenario";
import { useAutosave } from "@/lib/hooks/useAutosave";
import { workshopDataEndpoint } from "@/lib/workshopSource";

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

export function HomeworkClient({
  viewOnly = false,
  only,
  participantId,
}: {
  viewOnly?: boolean;
  only?: "company" | "society";
  participantId?: string;
} = {}) {
  const [company, setCompany] = useState<Blanks>({});
  const [society, setSociety] = useState<Blanks>({});
  const [headerName, setHeaderName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const d = await fetch(workshopDataEndpoint(participantId), { credentials: "include" })
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

  const display = viewOnly ? "display" : "edit";

  const save = async (next: { company: Blanks; society: Blanks }) => {
    const res = await fetch("/api/workshop/me/homework", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ scenario: next }),
    });
    return res.ok;
  };

  // 送信対象は編集中の軸だけ（company/societyは初回ロードで両方とも取得済みなので、
  // 未編集の側もそのまま一緒に送っても消えない）。
  const activeValue = only === "society" ? society : company;
  const { status, saveNow } = useAutosave(
    activeValue,
    () => save({ company, society }),
    { enabled: !loading && !viewOnly }
  );

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

  const intro = "「こうなっていたい！」という未来を描こう。妄想でOKです！";

  return (
    <WorksheetStage>
      {/* 編集モードは戻りリンクなし（ヘッダーの「宿題トップへ戻る」に一本化）。
          閲覧モード（事後の記録閲覧）のときだけ、記録一覧への戻り導線とバッジ／PDFを出す。 */}
      {/* 受講生が自分の記録を見返すときの案内バー。
         講師の投影ビュー（participantId あり）では出さない。
         戻り先が受講生用ページなので、講師が押すと迷子になるため。 */}
      {viewOnly && !participantId && (
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

      {/* #1 会社編 */}
      {(!only || only === "company") && (
        <PrintSheet>
          <SheetHeader
            no={8}
            accent="みらい"
            title="シナリオ"
            sub="〜 20xx年のじぶんを妄想する"
            right={nameTag}
          />
          <div className="mt-3 flex items-center gap-3">
            <SectionLabel>#1 COMPANY（会社編）</SectionLabel>
            <p className="text-sm text-ws-muted">{intro}</p>
          </div>
          <FillBlankScenario
            template={COMPANY_TEMPLATE}
            values={company}
            onChange={setCompanyDirty}
            mode={display}
            compact
          />
        </PrintSheet>
      )}

      {/* #2 社会編 */}
      {(!only || only === "society") && (
        <PrintSheet>
          <SheetHeader
            no={8}
            accent="みらい"
            title="シナリオ"
            sub="〜 20xx年のじぶんを妄想する"
            right={nameTag}
          />
          <div className="mt-3 flex items-center gap-3">
            <SectionLabel>#2 SOCIETY（社会編）</SectionLabel>
            <p className="text-sm text-ws-muted">{intro}</p>
          </div>
          <FillBlankScenario
            template={SOCIETY_TEMPLATE}
            values={society}
            onChange={setSocietyDirty}
            mode={display}
            compact
          />
        </PrintSheet>
      )}

      {!viewOnly && (
        <HomeworkSaveBar
          status={status}
          saveNow={saveNow}
          returnHref="/workshop/homework/scenario"
        />
      )}
    </WorksheetStage>
  );

  function setCompanyDirty(next: Blanks) {
    setCompany(next);
  }
  function setSocietyDirty(next: Blanks) {
    setSociety(next);
  }
}
