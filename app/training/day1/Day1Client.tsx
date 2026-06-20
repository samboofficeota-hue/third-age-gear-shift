"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, ChevronUp, ChevronDown } from "lucide-react";
import { PrintSheet } from "@/components/worksheet/PrintSheet";
import { SheetHeader, formatHeaderName } from "@/components/worksheet/SheetHeader";
import { PrintButton } from "@/components/worksheet/PrintButton";
import { WorksheetStage } from "@/components/worksheet/WorksheetStage";
import {
  CommunityPortfolio,
  type PortfolioCircle,
} from "@/components/worksheet/CommunityPortfolio";
import {
  SukiTokuiMatrix,
  type MatrixEntry,
} from "@/components/worksheet/SukiTokuiMatrix";
import {
  WorkOrigin,
  type WorkOriginEntry,
} from "@/components/worksheet/WorkOrigin";
import {
  WorkAlignment,
  type AlignmentData,
} from "@/components/worksheet/WorkAlignment";
import {
  SocialContact,
  type SocialContactData,
} from "@/components/worksheet/SocialContact";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ShareRow = { bunjin: string; share: string; meaning: string };
type Bunkai = { shareTable?: ShareRow[]; portfolio?: PortfolioCircle[] };
type Bunseki = {
  sukiTokui?: MatrixEntry[];
  workOrigin?: WorkOriginEntry[];
  alignment?: AlignmentData;
  socialContact?: SocialContactData;
};

const EMPTY_ALIGNMENT: AlignmentData = { vision: "", whyWork: "", achieve: "" };
const EMPTY_SOCIAL: SocialContactData = { have: [], missing: [] };

const MAX_ROWS = 10;
const DEFAULT_ROWS = 5;

// 記入例（「記入例を見る」）はハードコードではなく、DEMOアカウントの実データを読む
type Example = {
  shareTable: ShareRow[];
  portfolio: PortfolioCircle[];
  sukiTokui: MatrixEntry[];
  workOrigin: WorkOriginEntry[];
  alignment: AlignmentData;
  socialContact: SocialContactData;
};

const EMPTY: ShareRow = { bunjin: "", share: "", meaning: "" };

function padRows(rows: ShareRow[] | undefined, n: number): ShareRow[] {
  const r = [...(rows ?? [])];
  while (r.length < n) r.push({ ...EMPTY });
  return r.slice(0, MAX_ROWS);
}

export function Day1Client({ viewOnly = false }: { viewOnly?: boolean } = {}) {
  const [rows, setRows] = useState<ShareRow[]>(padRows([], DEFAULT_ROWS));
  const [count, setCount] = useState(DEFAULT_ROWS);
  const [portfolio, setPortfolio] = useState<PortfolioCircle[]>([]);
  const [sukiTokui, setSukiTokui] = useState<MatrixEntry[]>([]);
  const [workOrigin, setWorkOrigin] = useState<WorkOriginEntry[]>([]);
  const [alignment, setAlignment] = useState<AlignmentData>(EMPTY_ALIGNMENT);
  const [socialContact, setSocialContact] =
    useState<SocialContactData>(EMPTY_SOCIAL);
  const [headerName, setHeaderName] = useState("");
  const [mode, setMode] = useState<"edit" | "sample">("edit");
  const [example, setExample] = useState<Example | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isSample = mode === "sample";
  // viewOnly（事後の記録閲覧）と isSample（記入例）の両方で編集を止める
  const isReadOnly = isSample || viewOnly;

  useEffect(() => {
    (async () => {
      const d = await fetch("/api/workshop/me", { credentials: "include" })
        .then((r) => r.json())
        .catch(() => ({}));
      const ps = d?.workshopData?.pre?.profileSlide as
        | { name?: string; nickname?: string }
        | undefined;
      const nm = (ps?.name ?? d?.account?.name ?? "").trim();
      const nk = (ps?.nickname ?? "").trim();
      setHeaderName(formatHeaderName(nm, nk));

      const bunkai = d?.workshopData?.day1?.bunkai as Bunkai | undefined;
      const saved = bunkai?.shareTable ?? [];
      const n = Math.min(MAX_ROWS, Math.max(DEFAULT_ROWS, saved.length));
      setCount(n);
      setRows(padRows(saved, n));
      setPortfolio(bunkai?.portfolio ?? []);
      const bunseki = d?.workshopData?.day1?.bunseki as Bunseki | undefined;
      setSukiTokui(bunseki?.sukiTokui ?? []);
      setWorkOrigin(
        bunseki?.workOrigin?.length
          ? bunseki.workOrigin
          : [{ reason: "", experience: "" }]
      );
      setAlignment({ ...EMPTY_ALIGNMENT, ...(bunseki?.alignment ?? {}) });
      setSocialContact({ ...EMPTY_SOCIAL, ...(bunseki?.socialContact ?? {}) });
      setLoading(false);
    })();
  }, []);

  // 記入例（DEMOアカウントの実データ）を初回の「記入例を見る」で取得
  useEffect(() => {
    if (mode !== "sample" || example) return;
    (async () => {
      const d = await fetch("/api/workshop/example", { credentials: "include" })
        .then((r) => r.json())
        .catch(() => ({}));
      const day1 = (d?.example?.day1 ?? {}) as {
        bunkai?: Bunkai;
        bunseki?: Bunseki;
      };
      setExample({
        shareTable: day1.bunkai?.shareTable ?? [],
        portfolio: day1.bunkai?.portfolio ?? [],
        sukiTokui: day1.bunseki?.sukiTokui ?? [],
        workOrigin: day1.bunseki?.workOrigin ?? [],
        alignment: { ...EMPTY_ALIGNMENT, ...(day1.bunseki?.alignment ?? {}) },
        socialContact: {
          ...EMPTY_SOCIAL,
          ...(day1.bunseki?.socialContact ?? {}),
        },
      });
    })();
  }, [mode, example]);

  // 「保存しました ✓」は3秒で自動的に消す
  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 3000);
    return () => clearTimeout(t);
  }, [saved]);

  const view = isSample
    ? (example?.shareTable ?? []).filter((r) => r.bunjin.trim())
    : viewOnly
      ? rows.filter((r) => r.bunjin.trim() || r.share.trim() || r.meaning.trim())
      : padRows(rows, count);

  const setCell = (i: number, key: keyof ShareRow, v: string) => {
    if (isReadOnly) return;
    setRows((rs) => {
      const next = padRows(rs, count);
      next[i] = { ...next[i], [key]: v };
      return next;
    });
    setSaved(false);
  };

  const move = (i: number, dir: -1 | 1) => {
    if (isReadOnly) return;
    const j = i + dir;
    if (j < 0 || j >= count) return;
    setRows((rs) => {
      const next = padRows(rs, count);
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    setSaved(false);
  };

  const setPortfolioDirty = (next: PortfolioCircle[]) => {
    setPortfolio(next);
    setSaved(false);
  };
  const setSukiTokuiDirty = (next: MatrixEntry[]) => {
    setSukiTokui(next);
    setSaved(false);
  };
  const setWorkOriginDirty = (next: WorkOriginEntry[]) => {
    setWorkOrigin(next);
    setSaved(false);
  };
  const setAlignmentDirty = (next: AlignmentData) => {
    setAlignment(next);
    setSaved(false);
  };
  const setSocialContactDirty = (next: SocialContactData) => {
    setSocialContact(next);
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const shareTable = padRows(rows, count).filter(
        (r) => r.bunjin.trim() || r.share.trim() || r.meaning.trim()
      );
      const workOriginClean = workOrigin
        .map((e) => ({ reason: e.reason.trim(), experience: e.experience.trim() }))
        .filter((e) => e.reason || e.experience);
      const socialContactClean: SocialContactData = {
        have: socialContact.have.map((s) => s.trim()).filter(Boolean),
        missing: socialContact.missing.map((s) => s.trim()).filter(Boolean),
      };
      const res = await fetch("/api/workshop/me/day1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          bunkai: { shareTable, portfolio },
          bunseki: {
            sukiTokui,
            workOrigin: workOriginClean,
            alignment,
            socialContact: socialContactClean,
          },
        }),
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

  return (
    <WorksheetStage>
      {/* 操作バー */}
      <div className="no-print flex w-full max-w-[1123px] flex-wrap items-center justify-between gap-3">
        <Link
          href={viewOnly ? "/workshop/records" : "/training"}
          className="inline-flex items-center gap-1.5 text-sm text-ws-muted hover:text-ws-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          {viewOnly ? "ワークの記録 一覧へ" : "研修本番へ戻る"}
        </Link>
        <div className="flex items-center gap-2">
          {viewOnly ? (
            <span className="rounded-full border border-ws-teal/30 bg-ws-mint/40 px-4 py-2 text-sm font-medium text-ws-teal">
              閲覧モード（書き込みはできません）
            </span>
          ) : (
            (["edit", "sample"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  mode === m
                    ? "border-ws-teal bg-ws-mint text-ws-teal"
                    : "border-ws-line text-ws-muted hover:text-ws-ink"
                )}
              >
                {m === "edit" ? "記入する" : "記入例を見る"}
              </button>
            ))
          )}
          <PrintButton />
        </div>
      </div>

      {/* ── 分人シェア表 ── */}
      <PrintSheet>
        <SheetHeader
          no={2}
          accent="じぶん"
          title="分解"
          sub="〜 分人シェア表"
          right={nameTag}
        />

        <p className="mt-3 text-sm text-ws-muted">
          あなたの中にいる いろいろな「分人（ぶんじん）」を書き出し、シェア（割合・頻度）と、
          自分の中での位置づけを書いてみましょう。（5つ以上・最大10）
        </p>

        {/* 列見出し */}
        <div className="mt-6 flex items-center gap-3 border-b-2 border-ws-line pb-2 text-xs font-semibold text-ws-teal">
          <span className="w-9 shrink-0 text-center">No</span>
          <span className="w-12 shrink-0" />
          <span className="flex-[2]">どんな分人</span>
          <span className="w-52 shrink-0">割合・頻度</span>
          <span className="flex-[2]">自分の中の位置づけ</span>
        </div>

        {/* 行 */}
        <ul className="mt-2">
          {view.map((r, i) => (
            <li
              key={i}
              className="flex items-center gap-3 border-b border-ws-line py-2"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ws-accent text-sm font-bold text-white">
                {i + 1}
              </span>

              {/* 並べ替え（印刷されない） */}
              <div className="no-print flex w-12 shrink-0 flex-col items-center">
                {!isReadOnly && (
                  <>
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      aria-label="上へ"
                      className="text-ws-muted hover:text-ws-teal disabled:opacity-25"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={i >= count - 1}
                      aria-label="下へ"
                      className="text-ws-muted hover:text-ws-teal disabled:opacity-25"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>

              {isReadOnly ? (
                <>
                  <span className="flex-[2] text-lg text-ws-ink">{r.bunjin}</span>
                  <span className="w-52 shrink-0 text-lg text-ws-ink">{r.share}</span>
                  <span className="flex-[2] text-lg text-ws-ink">{r.meaning}</span>
                </>
              ) : (
                <>
                  <input
                    value={r.bunjin}
                    onChange={(e) => setCell(i, "bunjin", e.target.value)}
                    placeholder="〇〇な自分"
                    className="flex-[2] rounded-md border border-ws-line px-3 py-2 text-lg text-ws-ink outline-none placeholder:text-ws-muted/60 focus:border-ws-teal"
                  />
                  <input
                    value={r.share}
                    onChange={(e) => setCell(i, "share", e.target.value)}
                    placeholder="何%ぐらい？ 頻度は？"
                    className="w-52 shrink-0 rounded-md border border-ws-line px-3 py-2 text-lg text-ws-ink outline-none placeholder:text-ws-muted/60 focus:border-ws-teal"
                  />
                  <input
                    value={r.meaning}
                    onChange={(e) => setCell(i, "meaning", e.target.value)}
                    placeholder="自分の中のどんな存在"
                    className="flex-[2] rounded-md border border-ws-line px-3 py-2 text-lg text-ws-ink outline-none placeholder:text-ws-muted/60 focus:border-ws-teal"
                  />
                </>
              )}
            </li>
          ))}

          {/* 行を追加 */}
          {!isReadOnly && count < MAX_ROWS && (
            <li className="no-print pt-3">
              <button
                type="button"
                onClick={() => setCount((c) => Math.min(MAX_ROWS, c + 1))}
                className="inline-flex items-center gap-2 text-sm text-ws-muted hover:text-ws-teal"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-dashed border-ws-line">
                  <Plus className="h-4 w-4" />
                </span>
                行を追加（最大{MAX_ROWS}）
              </button>
            </li>
          )}
        </ul>
      </PrintSheet>

      {/* ── コミュニティ・ポートフォリオ ── */}
      <PrintSheet>
        <SheetHeader
          no={2}
          accent="じぶん"
          title="分解"
          sub="〜 マイ・ポートフォリオ"
          right={nameTag}
        />
        <p className="mt-3 text-sm text-ws-muted">
          あなたが関わっているコミュニティ・活動を、種類ごとに円で配置してみましょう。（円をクリックすると編集できます）
        </p>
        <CommunityPortfolio
          value={isSample ? example?.portfolio ?? [] : portfolio}
          onChange={setPortfolioDirty}
          readOnly={isReadOnly}
        />
      </PrintSheet>

      {/* ── 好き・得意マトリクス（じぶん分析） ── */}
      <PrintSheet>
        <SheetHeader
          no={3}
          accent="じぶん"
          title="分析"
          sub="〜 好き・得意マトリクス"
          right={nameTag}
        />
        <p className="mt-3 text-sm text-ws-muted">
          「個人／会社」×「得意／好き」の4象限に、思いつくことを書き出してみましょう。（カードをクリックして編集可能）
        </p>
        <SukiTokuiMatrix
          value={isSample ? example?.sukiTokui ?? [] : sukiTokui}
          onChange={setSukiTokuiDirty}
          readOnly={isReadOnly}
        />
      </PrintSheet>

      {/* ── "はたらく"の原点（じぶん分析） ── */}
      <PrintSheet>
        <SheetHeader
          no={3}
          accent="じぶん"
          title="分析"
          sub={'〜 "はたらく"の原点'}
          right={nameTag}
        />
        <p className="mt-3 text-sm text-ws-muted">
          やりがいを感じた経験、働きがいを感じた瞬間など。なぜ自分は働くのか、その「原体験」を思い出してみましょう。（最大3点）
        </p>
        <WorkOrigin
          value={isSample ? example?.workOrigin ?? [] : workOrigin}
          onChange={setWorkOriginDirty}
          readOnly={isReadOnly}
        />
      </PrintSheet>

      {/* ── 会社とじぶんの一致点（じぶん分析） ── */}
      <PrintSheet>
        <SheetHeader
          no={4}
          accent="じぶん"
          title="分析"
          sub="〜 会社とじぶんの一致点"
          right={nameTag}
        />
        <p className="mt-3 text-sm text-ws-muted">
          なぜ今の会社に入ろうと思ったのか。じぶんがやりたいことと、どう一致しているのか掘り下げてみよう。
        </p>
        <WorkAlignment
          value={isSample ? example?.alignment ?? EMPTY_ALIGNMENT : alignment}
          onChange={setAlignmentDirty}
          readOnly={isReadOnly}
        />
      </PrintSheet>

      {/* ── 社会とじぶんの接点（じぶん分析） ── */}
      <PrintSheet>
        <SheetHeader
          no={5}
          accent="じぶん"
          title="分析"
          sub="〜 社会とじぶんの接点"
          right={nameTag}
        />
        <p className="mt-3 text-sm text-ws-muted">
          「どんな社会」と、どんな「接点」が持てているのか、逆に持てていないのか、書き出してみよう。
        </p>
        <SocialContact
          value={isSample ? example?.socialContact ?? EMPTY_SOCIAL : socialContact}
          onChange={setSocialContactDirty}
          readOnly={isReadOnly}
        />
      </PrintSheet>

      {/* 保存（右下フロート・全シート一括／印刷では非表示） */}
      {!isReadOnly && (
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
