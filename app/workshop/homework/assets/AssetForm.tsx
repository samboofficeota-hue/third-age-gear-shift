"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { PrintSheet } from "@/components/worksheet/PrintSheet";
import { SheetHeader, formatHeaderName } from "@/components/worksheet/SheetHeader";
import { WorksheetStage } from "@/components/worksheet/WorksheetStage";
import { HomeworkSaveBar } from "@/components/worksheet/HomeworkSaveBar";
import { useAutosave } from "@/lib/hooks/useAutosave";
import { cn } from "@/lib/utils";
import {
  ASSET_KEYS,
  ASSET_META,
  EMPTY_ANSWERS,
  hasText,
  type AssetAnswers,
  type AssetKey,
  type AssetsData,
} from "@/lib/homework/assets/meta";

/** #1〜#3の設問行。プレースホルダーの問いかけ（hint）は3行とも共通。 */
function QuestionRow({
  no,
  color,
  hint,
  value,
  onChange,
  readOnly = false,
}: {
  no: number;
  color: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
        style={{ backgroundColor: color }}
      >
        {no}
      </span>
      <div className="flex-1">
        <textarea
          readOnly={readOnly}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`どんな資産？（${hint}）`}
          rows={2}
          className="w-full resize-none rounded-xl border border-ws-line px-4 py-3 text-base font-bold leading-snug text-ws-ink outline-none placeholder:font-normal placeholder:text-ws-muted/60 focus:border-ws-teal"
        />
      </div>
    </div>
  );
}

export function AssetForm({
  assetKey,
  viewOnly = false,
}: {
  assetKey: AssetKey;
  viewOnly?: boolean;
}) {
  const meta = ASSET_META[assetKey];
  const [allAssets, setAllAssets] = useState<AssetsData>({});
  const [values, setValues] = useState<AssetAnswers>(EMPTY_ANSWERS);
  const [headerName, setHeaderName] = useState("");
  const [loading, setLoading] = useState(true);

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
      const a = (d?.workshopData?.homework?.assets ?? {}) as AssetsData;
      setAllAssets(a);
      setValues(a[assetKey] ?? EMPTY_ANSWERS);
      setLoading(false);
    })();
  }, [assetKey]);

  const setAt = (i: number, v: string) => {
    setValues((prev) => {
      const next = [...prev] as AssetAnswers;
      next[i] = v;
      return next;
    });
  };

  const save = async (v: AssetAnswers) => {
    const nextAssets: AssetsData = { ...allAssets, [assetKey]: v };
    const res = await fetch("/api/workshop/me/homework", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ assets: nextAssets }),
    });
    if (res.ok) setAllAssets(nextAssets);
    return res.ok;
  };

  const { status, saveNow } = useAutosave(values, save, {
    enabled: !loading && !viewOnly,
  });

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
      <PrintSheet>
        <SheetHeader
          no={9}
          accent="じぶん"
          title="資産表"
          sub={`〜 ${meta.label}の価値を規定する`}
          right={nameTag}
        />

        {/* タイトル行：バッジ＋説明を1行に並べる */}
        <div className="mt-4 flex items-center gap-4">
          <span
            className="shrink-0 rounded-xl px-6 py-2.5 text-lg font-bold text-white"
            style={{ backgroundColor: meta.color }}
          >
            {meta.label}
          </span>
          <p className="whitespace-pre-line text-sm leading-relaxed text-ws-muted">
            {meta.description}
          </p>
        </div>

        {/* 質問タイトル */}
        <div
          className="mt-4 rounded-lg px-4 py-2.5 text-base font-bold"
          style={{ backgroundColor: `${meta.color}1A`, color: meta.color }}
        >
          {meta.questionTitle}
        </div>

        {/* 回答欄 */}
        <div className="mt-4 space-y-3">
          {values.map((v, i) => (
            <QuestionRow
              key={i}
              no={i + 1}
              color={meta.color}
              hint={meta.hint}
              value={v}
              onChange={(nv) => setAt(i, nv)}
              readOnly={viewOnly}
            />
          ))}
        </div>

        {/* 他の資産 */}
        {!viewOnly && (
          <div className="no-print mt-6 flex items-center gap-3">
            <p className="shrink-0 text-caption font-semibold text-ws-muted">他の資産</p>
            {ASSET_KEYS.filter((k) => k !== assetKey).map((k) => {
              const otherMeta = ASSET_META[k];
              const done = hasText(allAssets[k]);
              return (
                <Link
                  key={k}
                  href={`/workshop/homework/assets/${k}`}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors",
                    done
                      ? "border-ws-line/60 text-ws-muted hover:border-ws-teal hover:text-ws-ink"
                      : "border-ws-line text-ws-ink hover:border-ws-teal"
                  )}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: otherMeta.color }}
                  />
                  {otherMeta.label}
                  {done && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                </Link>
              );
            })}
          </div>
        )}
      </PrintSheet>

      {!viewOnly && (
        <HomeworkSaveBar
          status={status}
          saveNow={saveNow}
          returnHref="/workshop/homework/assets"
        />
      )}
    </WorksheetStage>
  );
}
