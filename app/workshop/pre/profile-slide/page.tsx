"use client";

import { useEffect, useRef, useState } from "react";
import type { Area } from "react-easy-crop";
import Link from "next/link";
import { formatHeaderName } from "@/components/worksheet/SheetHeader";
import { WorksheetStage } from "@/components/worksheet/WorksheetStage";
import { PrintButton } from "@/components/worksheet/PrintButton";
import { CropModal } from "@/components/worksheet/CropModal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { pad, padHist, type Slide, type Work, type HistRow } from "./_types";
import { MIN_HIST_ROWS } from "./_constants";
import { RuleSheet } from "./sheets/RuleSheet";
import { IntroSheet } from "./sheets/IntroSheet";
import { HistorySheet } from "./sheets/HistorySheet";
import { WorkSheet } from "./sheets/WorkSheet";

/**
 * じぶん紹介（事前課題）オーケストレーター。
 * 役割:
 *  - WorkshopData.pre.profileSlide の load / save
 *  - 写真アップロード／クロップ／再調整のフロー（ref と Storage API を持つ）
 *  - 記入する / 記入例 のモード切替
 *  - 各シート（ルール／#1 名前・写真・ポイント／#2 生い立ち／#3 今の会社）に slice を渡す
 */
export default function ProfileSlidePage() {
  const [data, setData] = useState<Slide>({ points: pad([]) });
  const [mode, setMode] = useState<"edit" | "sample">("edit");
  const [example, setExample] = useState<Slide | null>(null);
  const [visibleCount, setVisibleCount] = useState(3);
  const [histCount, setHistCount] = useState(MIN_HIST_ROWS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropInitial, setCropInitial] = useState<Area | undefined>(undefined);
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingOriginalRef = useRef<File | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    (async () => {
      const d = await fetch("/api/workshop/me", { credentials: "include" })
        .then((r) => r.json())
        .catch(() => ({}));
      const acct = (d?.account ?? {}) as {
        organizationName?: string | null;
        department?: string | null;
      };
      const ps = d?.workshopData?.pre?.profileSlide as Slide | undefined;
      const points = pad(ps?.points);
      setData({
        ...ps,
        points,
        work: {
          ...ps?.work,
          company: ps?.work?.company ?? acct.organizationName ?? "",
          dept: ps?.work?.dept ?? acct.department ?? "",
        },
      });
      if (ps) {
        const filled = points.filter((p) => p.trim()).length;
        setVisibleCount(Math.min(5, Math.max(3, filled)));
        setHistCount(Math.max(MIN_HIST_ROWS, ps.history?.length ?? 0));
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (mode !== "sample" || example) return;
    (async () => {
      const d = await fetch("/api/workshop/example", { credentials: "include" })
        .then((r) => r.json())
        .catch(() => ({}));
      const ps = (d?.example?.pre?.profileSlide ?? {}) as Slide;
      setExample({ ...ps, points: pad(ps.points) });
    })();
  }, [mode, example]);

  const isSample = mode === "sample";
  const view: Slide = isSample
    ? example ?? { points: pad([]) }
    : { ...data, points: pad(data.points) };

  const headerName = formatHeaderName(view.name, view.nickname);

  const preTag = (
    <span className="text-sm font-semibold text-ws-teal">事前課題</span>
  );
  const nameTag = headerName ? (
    <span className="text-base font-bold text-ws-ink">{headerName}</span>
  ) : null;

  const setField = (patch: Partial<Slide>) => {
    if (isSample) return;
    setData((d) => ({ ...d, ...patch }));
    setSaved(false);
  };
  const setPoint = (i: number, v: string) => {
    if (isSample) return;
    setData((d) => {
      const points = pad(d.points);
      points[i] = v;
      return { ...d, points };
    });
    setSaved(false);
  };
  const setWork = (key: keyof Work, v: string) => {
    if (isSample) return;
    setData((d) => ({ ...d, work: { ...d.work, [key]: v } }));
    setSaved(false);
  };
  const setHist = (i: number, key: keyof HistRow, v: string) => {
    if (isSample) return;
    setData((d) => {
      const history = padHist(d.history, histCount);
      history[i] = { ...history[i], [key]: v };
      return { ...d, history };
    });
    setSaved(false);
  };

  const closeCrop = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setCropSrc(null);
    setCropInitial(undefined);
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isSample) return;
    pendingOriginalRef.current = file;
    setCropInitial(undefined);
    const reader = new FileReader();
    reader.onload = () => setCropSrc(String(reader.result));
    reader.readAsDataURL(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const onAdjust = async () => {
    if (isSample || !data.photoOriginal) return;
    try {
      // 元画像は認証付きの /api/photo 経由（同一オリジン）で取得する
      const res = await fetch(data.photoOriginal, { credentials: "include" });
      if (!res.ok) throw new Error("failed to load original photo");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      objectUrlRef.current = url;
      pendingOriginalRef.current = null;
      setCropInitial(data.photoArea);
      setCropSrc(url);
    } catch {
      alert("写真の読み込みに失敗しました。お手数ですが写真を選び直してください。");
    }
  };

  const onCropped = async (blob: Blob, area: Area) => {
    const original = pendingOriginalRef.current;
    closeCrop();
    setPhotoUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", new File([blob], "photo.jpg", { type: "image/jpeg" }));
      if (original) fd.append("original", original);
      const res = await fetch("/api/workshop/me/photo", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.url) {
        setField({
          photo: d.url,
          photoArea: area,
          ...(d.originalUrl ? { photoOriginal: d.originalUrl } : {}),
        });
      } else {
        alert(d.error ?? "アップロードに失敗しました。");
      }
    } finally {
      pendingOriginalRef.current = null;
      setPhotoUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/workshop/me/pre", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          profileSlide: { ...data, points: pad(data.points) },
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
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  const histRows = isSample
    ? (example?.history ?? []).filter((h) => h.year.trim() || h.event.trim())
    : padHist(data.history, histCount);

  return (
    <WorksheetStage>
      {/* 操作バー（印刷されない） */}
      <div className="no-print flex w-full max-w-[1123px] flex-wrap items-center justify-between gap-3">
        <Link
          href="/workshop/pre"
          className="text-sm text-[#a0c0b0] transition-colors hover:text-primary"
        >
          ← 事前課題へ戻る
        </Link>
        <Link
          href="/workshop/pre/life-plan"
          className="text-sm text-[#a0c0b0] transition-colors hover:text-primary"
        >
          ライフラインチャートをつくる（任意） →
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
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-[rgba(0,255,136,0.2)] text-[#a0c0b0] hover:text-[#e0f0e8]"
              )}
            >
              {m === "edit" ? "記入する" : "記入例を見る"}
            </button>
          ))}
          <PrintButton />
        </div>
      </div>

      <RuleSheet preTag={preTag} />

      <IntroSheet
        preTag={preTag}
        view={view}
        data={data}
        isSample={isSample}
        visibleCount={visibleCount}
        photoUploading={photoUploading}
        fileRef={fileRef}
        onPickFile={onFile}
        onAdjustPhoto={onAdjust}
        onUploadClick={() => fileRef.current?.click()}
        onSetField={setField}
        onSetPoint={setPoint}
        onIncreaseVisible={() => setVisibleCount((c) => Math.min(5, c + 1))}
      />

      <HistorySheet
        nameTag={nameTag}
        rows={histRows}
        isSample={isSample}
        onSetHist={setHist}
        onAddRow={() => setHistCount((c) => c + 1)}
      />

      <WorkSheet
        nameTag={nameTag}
        view={view}
        data={data}
        isSample={isSample}
        onSetWork={setWork}
      />

      {!isSample && (
        <div className="no-print flex w-full max-w-[1123px] items-center gap-3">
          <Button onClick={save} disabled={saving}>
            {saving ? "保存中..." : "保存する"}
          </Button>
          {saved && <span className="text-sm text-primary">保存しました ✓</span>}
        </div>
      )}

      {cropSrc && (
        <CropModal
          src={cropSrc}
          initialArea={cropInitial}
          onCancel={closeCrop}
          onConfirm={onCropped}
        />
      )}
    </WorksheetStage>
  );
}
