"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ImagePlus, Plus } from "lucide-react";
import { PrintSheet } from "@/components/worksheet/PrintSheet";
import { WorksheetStage } from "@/components/worksheet/WorksheetStage";
import { PrintButton } from "@/components/worksheet/PrintButton";
import { CropModal } from "@/components/worksheet/CropModal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Slide = {
  name?: string;
  nickname?: string;
  points?: string[];
  photo?: string;
};

const SAMPLE: Required<Slide> = {
  name: "太田 義史",
  nickname: "ぼうず",
  points: ["沖縄県 長寿家系 生", "東大 少林寺拳法学部 卒", "電通流 プロデュース術", "", ""],
  photo: "/images/worksheets/ota.png",
};

function pad(points?: string[]): string[] {
  const p = [...(points ?? [])];
  while (p.length < 5) p.push("");
  return p.slice(0, 5);
}

/** 円形の写真枠（読み込み失敗時はプレースホルダ＋ヒント表示） */
function PhotoFrame({ src }: { src?: string }) {
  const [err, setErr] = useState(false);
  useEffect(() => setErr(false), [src]);
  return (
    <div className="relative mx-auto flex aspect-square w-[260px] items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-ws-line bg-ws-fill">
      {src && !err ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt="プロフィール写真"
          onError={() => setErr(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="px-8 text-center">
          <p className="text-base font-semibold text-ws-muted">写真</p>
          <p className="mt-2 text-xs leading-relaxed text-ws-muted">
            恥ずかしがらずに写真をドーンと！
          </p>
        </div>
      )}
    </div>
  );
}

export default function ProfileSlidePage() {
  const [data, setData] = useState<Slide>({ points: pad([]) });
  const [mode, setMode] = useState<"edit" | "sample">("edit");
  const [visibleCount, setVisibleCount] = useState(3);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const d = await fetch("/api/workshop/me", { credentials: "include" })
        .then((r) => r.json())
        .catch(() => ({}));
      const ps = d?.workshopData?.pre?.profileSlide as Slide | undefined;
      if (ps) {
        const points = pad(ps.points);
        setData({ ...ps, points });
        const filled = points.filter((p) => p.trim()).length;
        setVisibleCount(Math.min(5, Math.max(3, filled)));
      }
      setLoading(false);
    })();
  }, []);

  const isSample = mode === "sample";
  const view: Slide = isSample ? SAMPLE : { ...data, points: pad(data.points) };

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

  // ファイル選択 → クロップモーダルを開く
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isSample) return;
    const reader = new FileReader();
    reader.onload = () => setCropSrc(String(reader.result));
    reader.readAsDataURL(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  // クロップ確定 → Storage にアップロード → URL を保存
  const onCropped = async (blob: Blob) => {
    setCropSrc(null);
    setPhotoUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", new File([blob], "photo.jpg", { type: "image/jpeg" }));
      const res = await fetch("/api/workshop/me/photo", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.url) setField({ photo: d.url });
      else alert(d.error ?? "アップロードに失敗しました。");
    } finally {
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
        body: JSON.stringify({ profileSlide: { ...data, points: pad(data.points) } }),
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

  const allPoints = pad(view.points);
  // 編集時は visibleCount 件、記入例は中身のある分だけ表示
  const pointRows = isSample
    ? allPoints.map((p, i) => ({ p, i })).filter((x) => x.p.trim())
    : allPoints.slice(0, visibleCount).map((p, i) => ({ p, i }));

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

      {/* ── ルールシート ── */}
      <PrintSheet>
        <div className="flex items-center justify-between border-b border-ws-line pb-4">
          <div className="flex items-center gap-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ws-teal text-lg font-bold text-white">
              1
            </span>
            <h1 className="text-3xl font-bold text-ws-ink">
              <span className="text-ws-accent">じぶん</span> 紹介
            </h1>
          </div>
          <span className="text-sm font-semibold text-ws-teal">事前課題</span>
        </div>
        <div className="mt-10 rounded-2xl bg-ws-mint p-10">
          <span className="inline-block rounded-full border border-ws-teal bg-white px-4 py-1 text-sm font-semibold text-ws-teal">
            ルール
          </span>
          <dl className="mt-8 space-y-7 text-ws-ink">
            <div className="flex gap-8">
              <dt className="w-32 shrink-0 font-bold">● 発表時間</dt>
              <dd>
                <span className="text-2xl font-bold text-ws-accent">5分以内</span>
                <span className="ml-2 text-sm text-ws-muted">（1ページ 1分以内を目安に）</span>
              </dd>
            </div>
            <div className="flex gap-8">
              <dt className="w-32 shrink-0 font-bold">● 目的</dt>
              <dd className="space-y-1.5 leading-relaxed">
                <p>他のメンバーに <span className="font-bold text-ws-accent">わたし</span> のことを知ってもらうこと</p>
                <p>自分で <span className="font-bold text-ws-accent">わたし</span> について掘り下げてみること</p>
              </dd>
            </div>
            <div className="flex gap-8">
              <dt className="w-32 shrink-0 font-bold">● 内容</dt>
              <dd className="space-y-1.5 leading-relaxed">
                <p>知ってほしい 3つのポイント</p>
                <p>生い立ち</p>
                <p>今の会社・今の仕事</p>
              </dd>
            </div>
          </dl>
        </div>
      </PrintSheet>

      {/* ── ページ① 名前＋写真＋3ポイント ── */}
      <PrintSheet>
        <div className="flex items-center justify-between border-b border-ws-line pb-4">
          <div className="flex items-center gap-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ws-teal text-lg font-bold text-white">
              1
            </span>
            <h1 className="text-3xl font-bold text-ws-ink">
              <span className="text-ws-accent">じぶん</span> 紹介
            </h1>
          </div>
          <span className="text-sm font-semibold text-ws-teal">事前課題</span>
        </div>

        <div className="mt-8 flex gap-12">
          {/* 左：円形写真 ＋ ニックネーム（下揃え） */}
          <div className="flex w-[300px] shrink-0 flex-col">
            <PhotoFrame src={view.photo} />

            {!isSample && (
              <div className="no-print mt-4 text-center">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={onFile}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={photoUploading}
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-lg border border-ws-line px-4 py-2 text-sm text-ws-ink hover:border-ws-teal disabled:opacity-60"
                >
                  <ImagePlus className="h-4 w-4" />
                  {photoUploading ? "アップロード中…" : "写真をアップロード"}
                </button>
              </div>
            )}

            {/* ニックネーム（左列の下端に揃える） */}
            <div className="mt-auto pt-6">
              {isSample ? (
                <div className="text-center">
                  <p className="text-xs font-semibold text-ws-muted">
                    ニックネーム
                  </p>
                  <p className="mt-1 text-2xl font-bold text-ws-accent">
                    {view.nickname}
                  </p>
                </div>
              ) : (
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-ws-muted">
                    ニックネーム（研修中に呼ばれたい名前）
                  </span>
                  <input
                    value={data.nickname ?? ""}
                    onChange={(e) => setField({ nickname: e.target.value })}
                    placeholder="ニックネーム"
                    className="w-full rounded-md border border-ws-line px-3 py-2 text-center text-xl font-bold text-ws-accent outline-none focus:border-ws-teal"
                  />
                </label>
              )}
            </div>
          </div>

          {/* 右：お名前（1行）＋ 3ポイント */}
          <div className="flex-1">
            <div className="border-b border-ws-line pb-4">
              {isSample ? (
                <>
                  <p className="text-xs font-semibold text-ws-muted">お名前</p>
                  <p className="mt-1 text-3xl font-bold text-ws-ink">{view.name}</p>
                </>
              ) : (
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-ws-muted">
                    お名前
                  </span>
                  <input
                    value={data.name ?? ""}
                    onChange={(e) => setField({ name: e.target.value })}
                    placeholder="お名前"
                    className="w-full rounded-md border border-ws-line px-3 py-2 text-2xl font-bold text-ws-ink outline-none focus:border-ws-teal"
                  />
                </label>
              )}
            </div>

            <p className="mt-6 text-sm font-semibold text-ws-teal">
              知ってほしい 3つのポイント
              <span className="ml-2 font-normal text-ws-muted">（一言で）</span>
            </p>
            <ul className="mt-4 space-y-3.5">
              {pointRows.map(({ p, i }) => (
                <li key={i} className="flex items-center gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ws-accent text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  {isSample ? (
                    <span className="text-xl font-medium text-ws-ink">{p}</span>
                  ) : (
                    <input
                      value={p}
                      onChange={(e) => setPoint(i, e.target.value)}
                      placeholder="（一言で）"
                      className="w-full rounded-md border border-ws-line px-3 py-2 text-lg text-ws-ink outline-none focus:border-ws-teal"
                    />
                  )}
                </li>
              ))}

              {/* ＋ で4つ目・5つ目を追加 */}
              {!isSample && visibleCount < 5 && (
                <li className="no-print flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((c) => Math.min(5, c + 1))}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-ws-line text-ws-muted hover:border-ws-teal hover:text-ws-teal"
                    aria-label="ポイントを追加"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-ws-muted">
                    ポイントを追加（最大5つ）
                  </span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </PrintSheet>

      {/* 保存（印刷されない） */}
      {!isSample && (
        <div className="no-print flex w-full max-w-[1123px] items-center gap-3">
          <Button onClick={save} disabled={saving}>
            {saving ? "保存中..." : "保存する"}
          </Button>
          {saved && <span className="text-sm text-primary">保存しました ✓</span>}
        </div>
      )}

      {/* クロップモーダル */}
      {cropSrc && (
        <CropModal
          src={cropSrc}
          onCancel={() => setCropSrc(null)}
          onConfirm={onCropped}
        />
      )}
    </WorksheetStage>
  );
}
