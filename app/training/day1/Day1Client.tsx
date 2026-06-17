"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, ChevronUp, ChevronDown } from "lucide-react";
import { PrintSheet } from "@/components/worksheet/PrintSheet";
import { SheetHeader, formatHeaderName } from "@/components/worksheet/SheetHeader";
import { PrintButton } from "@/components/worksheet/PrintButton";
import { WorksheetStage } from "@/components/worksheet/WorksheetStage";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ShareRow = { bunjin: string; share: string; meaning: string };
type Bunkai = { shareTable?: ShareRow[] };

const MAX_ROWS = 10;
const DEFAULT_ROWS = 5;

const SAMPLE: ShareRow[] = [
  { bunjin: "代表社員として働く自分", share: "50%ぐらい", meaning: "お金と使命感で重要" },
  { bunjin: "父・家族の中の自分", share: "20%ぐらい", meaning: "心の支え・原点" },
  { bunjin: "少林寺拳法の指導者の自分", share: "10%ぐらい", meaning: "鍛錬・人とのつながり" },
  { bunjin: "沖縄の長男としての自分", share: "10%ぐらい", meaning: "ルーツ・責任" },
  { bunjin: "学び続ける自分", share: "10%ぐらい", meaning: "好奇心・成長" },
];

const EMPTY: ShareRow = { bunjin: "", share: "", meaning: "" };

function padRows(rows: ShareRow[] | undefined, n: number): ShareRow[] {
  const r = [...(rows ?? [])];
  while (r.length < n) r.push({ ...EMPTY });
  return r.slice(0, MAX_ROWS);
}

export function Day1Client() {
  const [rows, setRows] = useState<ShareRow[]>(padRows([], DEFAULT_ROWS));
  const [count, setCount] = useState(DEFAULT_ROWS);
  const [headerName, setHeaderName] = useState("");
  const [mode, setMode] = useState<"edit" | "sample">("edit");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isSample = mode === "sample";

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
      setLoading(false);
    })();
  }, []);

  const view = isSample ? SAMPLE.filter((r) => r.bunjin.trim()) : rows;

  const setCell = (i: number, key: keyof ShareRow, v: string) => {
    if (isSample) return;
    setRows((rs) => {
      const next = padRows(rs, count);
      next[i] = { ...next[i], [key]: v };
      return next;
    });
    setSaved(false);
  };

  const move = (i: number, dir: -1 | 1) => {
    if (isSample) return;
    const j = i + dir;
    if (j < 0 || j >= count) return;
    setRows((rs) => {
      const next = padRows(rs, count);
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const shareTable = padRows(rows, count).filter(
        (r) => r.bunjin.trim() || r.share.trim() || r.meaning.trim()
      );
      const res = await fetch("/api/workshop/me/day1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ bunkai: { shareTable } }),
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
          href="/training"
          className="inline-flex items-center gap-1.5 text-sm text-ws-muted hover:text-ws-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          研修本番へ戻る
        </Link>
        <div className="flex items-center gap-2">
          {(["edit", "sample"] as const).map((m) => (
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
          ))}
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
                {!isSample && (
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

              {isSample ? (
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
          {!isSample && count < MAX_ROWS && (
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

      {/* 保存 */}
      {!isSample && (
        <div className="no-print flex w-full max-w-[1123px] items-center gap-3">
          <Button onClick={save} disabled={saving}>
            {saving ? "保存中..." : "保存する"}
          </Button>
          {saved && <span className="text-sm text-ws-teal">保存しました ✓</span>}
        </div>
      )}
    </WorksheetStage>
  );
}
