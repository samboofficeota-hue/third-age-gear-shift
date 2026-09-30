"use client";

import { useEffect, useRef, useState } from "react";
import type { Area } from "react-easy-crop";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
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

/**
 * じぶん紹介（事前課題）オーケストレーター。
 * 役割:
 *  - WorkshopData.pre.profileSlide の load / save
 *  - 写真アップロード／クロップ／再調整のフロー（ref と Storage API を持つ）
 *  - 各シート（ルール／#1 名前・写真・ポイント／#2 生い立ち／#3 今の会社）に slice を渡す
 */
export default function ProfileSlidePage() {
  const [data, setData] = useState<Slide>({ points: pad([]) });
  const [visibleCount, setVisibleCount] = useState(3);
  const [histCount, setHistCount] = useState(MIN_HIST_ROWS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const router = useRouter();
  // ページ最後の「保存して次へ」が見えている間は、右下の浮かぶボタンを隠す（重複とフッターへの重なりを避ける）
  const nextBarRef = useRef<HTMLDivElement>(null);
  const [atEnd, setAtEnd] = useState(false);
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

  // 右下の「保存する」＝保存のみ（画面はそのまま）。
  // ページ下の「保存して次へ」＝保存できたら事前課題トップへ（次の課題が光っている）。
  const save = async ({ andNext = false }: { andNext?: boolean } = {}) => {
    setSaving(true);
    setSaved(false);
    setSaveError(null);
    try {
      const res = await fetch("/api/workshop/me/pre", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          profileSlide: { ...data, points: pad(data.points) },
        }),
      });
      if (res.ok) {
        setSaved(true);
        if (andNext) {
          router.push("/workshop/pre");
          router.refresh();
          return;
        }
        setSaving(false);
        return;
      }
      const body = await res.json().catch(() => ({}));
      setSaveError(body.error ?? "保存できませんでした。時間をおいてもう一度お試しください。");
    } catch {
      setSaveError("保存できませんでした。通信状況をご確認ください。");
    }
    setSaving(false);
  };

  // 「保存しました ✓」は3秒で自動的に消す
  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 3000);
    return () => clearTimeout(t);
  }, [saved]);

  useEffect(() => {
    const el = nextBarRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setAtEnd(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [loading]);

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

      {/* ページ最後：保存して次へ（事前課題トップへ戻り、次の課題に進む） */}
      <div ref={nextBarRef} className="no-print flex w-full max-w-[1100px] justify-end">
        <Button onClick={() => save({ andNext: true })} disabled={saving}>
          保存して次へ
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* 右下に浮かぶ保存ボタン（Day1・Day2 と同じ位置）。保存のみで画面は移らない */}
      <div className="no-print fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {saveError && (
          <span className="max-w-xs rounded-lg bg-white/95 px-3 py-1.5 text-sm font-medium text-destructive shadow-md ring-1 ring-ws-line">
            {saveError}
          </span>
        )}
        <div className="flex items-center gap-3">
          {saved && (
            <span className="rounded-full bg-white/95 px-3 py-1.5 text-sm font-medium text-ws-teal shadow-md ring-1 ring-ws-line">
              保存しました ✓
            </span>
          )}
          {!atEnd && (
            <Button onClick={() => save()} disabled={saving} className="rounded-full px-6 shadow-lg">
              {saving ? "保存中..." : "保存する"}
            </Button>
          )}
        </div>
      </div>

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
