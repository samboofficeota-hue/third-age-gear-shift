"use client";

import { useEffect, useRef, useState } from "react";
import type { Area } from "react-easy-crop";
import Link from "next/link";
import { ArrowRight, ImageIcon } from "lucide-react";
import { formatHeaderName } from "@/components/worksheet/SheetHeader";
import { WorksheetStage } from "@/components/worksheet/WorksheetStage";
import { CropModal } from "@/components/worksheet/CropModal";
import { Button } from "@/components/ui/button";
import { pad, padHist, type Slide, type Work, type HistRow } from "./_types";
import { MIN_HIST_ROWS, MAX_HIST_ROWS } from "./_constants";
import { RuleSheet } from "./sheets/RuleSheet";
import { IntroSheet } from "./sheets/IntroSheet";
import { HistorySheet } from "./sheets/HistorySheet";
import { WorkSheet } from "./sheets/WorkSheet";
import { SampleModal } from "./SampleModal";

/**
 * じぶん紹介（事前課題）オーケストレーター。
 * 役割:
 *  - WorkshopData.pre.profileSlide の load / save
 *  - 写真アップロード／クロップ／再調整のフロー（ref と Storage API を持つ）
 *  - 記入例モーダルの開閉
 *  - 各シート（ルール／#1 名前・写真・ポイント／#2 生い立ち／#3 今の会社）に slice を渡す
 */
export default function ProfileSlidePage() {
  const [data, setData] = useState<Slide>({ points: pad([]) });
  const [sampleOpen, setSampleOpen] = useState(false);
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

  const view: Slide = { ...data, points: pad(data.points) };

  const headerName = formatHeaderName(view.name, view.nickname);

  const preTag = (
    <span className="text-sm font-semibold text-ws-teal">事前課題</span>
  );
  const nameTag = headerName ? (
    <span className="text-base font-bold text-ws-ink">{headerName}</span>
  ) : null;

  const setField = (patch: Partial<Slide>) => {
    setData((d) => ({ ...d, ...patch }));
    setSaved(false);
  };
  const setPoint = (i: number, v: string) => {
    setData((d) => {
      const points = pad(d.points);
      points[i] = v;
      return { ...d, points };
    });
    setSaved(false);
  };
  const setWork = (key: keyof Work, v: string) => {
    setData((d) => ({ ...d, work: { ...d.work, [key]: v } }));
    setSaved(false);
  };
  const setHist = (i: number, key: keyof HistRow, v: string) => {
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
    if (!file) return;
    pendingOriginalRef.current = file;
    setCropInitial(undefined);
    const reader = new FileReader();
    reader.onload = () => setCropSrc(String(reader.result));
    reader.readAsDataURL(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const onAdjust = async () => {
    if (!data.photoOriginal) return;
    try {
      const res = await fetch(data.photoOriginal, { credentials: "omit" });
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

  const histRows = padHist(data.history, histCount);

  return (
    <WorksheetStage>
      <RuleSheet preTag={preTag} />

      <IntroSheet
        preTag={preTag}
        view={view}
        data={data}
        isSample={false}
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
        isSample={false}
        onSetHist={setHist}
        onAddRow={() => setHistCount((c) => Math.min(MAX_HIST_ROWS, c + 1))}
      />

      <WorkSheet
        nameTag={nameTag}
        view={view}
        data={data}
        isSample={false}
        onSetWork={setWork}
      />

      <div className="no-print flex w-full max-w-[1123px] items-center gap-3">
        {saved ? (
          <>
            <span className="text-sm text-primary">保存しました ✓</span>
            <Button asChild className="ml-auto">
              <Link href="/workshop/pre">
                事前課題へ戻る
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </>
        ) : (
          <>
            <Button onClick={save} disabled={saving}>
              {saving ? "保存中..." : "保存する"}
            </Button>
            <Link
              href="/workshop/pre"
              className="ml-auto text-sm text-muted-foreground hover:text-foreground"
            >
              事前課題へ戻る
            </Link>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={() => setSampleOpen(true)}
        className="no-print fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border border-primary bg-bg-dark px-4 py-2.5 text-sm font-medium text-primary shadow-neon-glow transition hover:bg-primary/10"
      >
        <ImageIcon className="h-4 w-4" />
        記入例を見る
      </button>

      {sampleOpen && <SampleModal onClose={() => setSampleOpen(false)} />}

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
