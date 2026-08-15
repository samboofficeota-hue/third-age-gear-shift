"use client";

import type { ReactNode, RefObject } from "react";
import { ImagePlus, Crop, Plus } from "lucide-react";
import { PrintSheet } from "@/components/worksheet/PrintSheet";
import { SheetHeader } from "@/components/worksheet/SheetHeader";
import { cn } from "@/lib/utils";
import { PhotoFrame } from "../_helpers";
import { pad, type Slide } from "../_types";

/**
 * じぶん紹介ページ①：写真＋名前＋ニックネーム＋3 つのポイント。
 * 写真のアップロード／調整／クロップは page 側で持っているため、ハンドラ群を props 受け取り。
 */
export function IntroSheet({
  preTag,
  view,
  data,
  isSample,
  visibleCount,
  photoUploading,
  fileRef,
  onPickFile,
  onAdjustPhoto,
  onUploadClick,
  onSetField,
  onSetPoint,
  onIncreaseVisible,
}: {
  preTag: ReactNode;
  view: Slide;
  data: Slide;
  isSample: boolean;
  visibleCount: number;
  photoUploading: boolean;
  fileRef: RefObject<HTMLInputElement>;
  onPickFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAdjustPhoto: () => void;
  onUploadClick: () => void;
  onSetField: (patch: Partial<Slide>) => void;
  onSetPoint: (i: number, v: string) => void;
  onIncreaseVisible: () => void;
}) {
  const allPoints = pad(view.points);

  return (
    <PrintSheet>
      <SheetHeader no={1} accent="じぶん" title="紹介" right={preTag} />

      <div className="mt-6 flex gap-10">
        {/* 左：お名前 + ニックネーム + 写真 */}
        <div className="flex w-[300px] shrink-0 flex-col gap-5">
          <div>
            {isSample ? (
              <div className="text-center">
                <p className="text-xs font-semibold text-ws-muted">お名前</p>
                <p className="mt-1 text-2xl font-bold text-ws-ink">{view.name}</p>
              </div>
            ) : (
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-ws-muted">
                  お名前
                </span>
                <input
                  value={data.name ?? ""}
                  onChange={(e) => onSetField({ name: e.target.value })}
                  placeholder="お名前"
                  className="w-full rounded-md border border-ws-line px-3 py-2 text-center text-2xl font-bold text-ws-ink outline-none focus:border-ws-teal"
                />
              </label>
            )}
          </div>

          <div>
            {isSample ? (
              <div className="text-center">
                <p className="text-xs font-semibold text-ws-muted">ニックネーム</p>
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
                  onChange={(e) => onSetField({ nickname: e.target.value })}
                  placeholder="ニックネーム"
                  className="w-full rounded-md border border-ws-line px-3 py-2 text-center text-xl font-bold text-ws-accent outline-none focus:border-ws-teal"
                />
              </label>
            )}
          </div>

          <div>
            <PhotoFrame src={view.photo} size={220} />

            {!isSample && (
              <div className="no-print mt-3 flex flex-wrap items-center justify-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={onPickFile}
                  className="hidden"
                />
                {data.photoOriginal && (
                  <button
                    type="button"
                    disabled={photoUploading}
                    onClick={onAdjustPhoto}
                    className="inline-flex items-center gap-2 rounded-lg border border-ws-line px-3 py-1.5 text-xs text-ws-ink hover:border-ws-teal disabled:opacity-60"
                  >
                    <Crop className="h-3.5 w-3.5" />
                    写真を調整
                  </button>
                )}
                <button
                  type="button"
                  disabled={photoUploading}
                  onClick={onUploadClick}
                  className="inline-flex items-center gap-2 rounded-lg border border-ws-line px-3 py-1.5 text-xs text-ws-ink hover:border-ws-teal disabled:opacity-60"
                >
                  <ImagePlus className="h-3.5 w-3.5" />
                  {photoUploading
                    ? "アップロード中…"
                    : data.photo
                      ? "写真を変更"
                      : "写真をアップロード"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 右：知ってほしい 3 つのポイント */}
        <div className="flex flex-1 flex-col">
          <p className="text-sm font-semibold text-ws-teal">
            知ってほしい 3つのポイント
          </p>
          <ul className="mt-5 flex flex-1 flex-col justify-between py-2">
            {[0, 1, 2, 3, 4].map((i) => {
              const val = allPoints[i] ?? "";
              const showInput = !isSample && i < visibleCount;
              const isAddSlot =
                !isSample && i === visibleCount && visibleCount < 5;

              if (isSample) {
                const has = !!val.trim();
                return (
                  <li key={i} className="flex items-center gap-4">
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ws-accent text-base font-bold text-white",
                        !has && "opacity-0"
                      )}
                    >
                      {i + 1}
                    </span>
                    <span className="text-3xl font-medium text-ws-ink">
                      {val || "　"}
                    </span>
                  </li>
                );
              }
              if (showInput) {
                return (
                  <li key={i} className="flex items-center gap-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ws-accent text-base font-bold text-white">
                      {i + 1}
                    </span>
                    <input
                      value={val}
                      onChange={(e) => onSetPoint(i, e.target.value)}
                      placeholder="（一言で）"
                      maxLength={25}
                      className="w-full rounded-md border border-ws-line px-3 py-2 text-3xl text-ws-ink outline-none focus:border-ws-teal"
                    />
                  </li>
                );
              }
              if (isAddSlot) {
                return (
                  <li key={i} className="no-print flex items-center gap-4">
                    <button
                      type="button"
                      onClick={onIncreaseVisible}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-ws-line text-ws-muted hover:border-ws-teal hover:text-ws-teal"
                      aria-label="ポイントを追加"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <span className="text-sm text-ws-muted">
                      ポイントを追加（最大5つ）
                    </span>
                  </li>
                );
              }
              return (
                <li key={i} className="flex items-center gap-4" aria-hidden>
                  <span className="h-9 w-9 shrink-0 opacity-0" />
                  <span className="text-3xl opacity-0">　</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </PrintSheet>
  );
}
