"use client";

// 第2段階：プチ越境体験レポート（実際にやってみた後、テンプレに記入する）。
// AIは介さない、通常のワークシート入力。

import { useRef, useState } from "react";
import { ImageIcon } from "lucide-react";
import { PrintSheet } from "@/components/worksheet/PrintSheet";
import { SheetHeader } from "@/components/worksheet/SheetHeader";
import { CropModal } from "@/components/worksheet/CropModal";
import { HomeworkSaveBar } from "@/components/worksheet/HomeworkSaveBar";
import { useAutosave } from "@/lib/hooks/useAutosave";
import { cn } from "@/lib/utils";
import type { ExcursionData } from "@/lib/homework/excursion/types";

/** 写真欄の縦横比（横長の1枚として置く。プロフィール写真の正方形・円形とは別） */
const PHOTO_ASPECT = 16 / 9;

type ReportValues = NonNullable<ExcursionData["report"]>;

const EMPTY_REPORT: ReportValues = {
  place: "",
  people: "",
  photo: "",
  impression: "",
};

function Field({
  label,
  value,
  onChange,
  placeholder,
  rows = 2,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  rows?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      <span className="mb-1 block text-sm font-semibold text-ws-teal">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-none rounded-lg border border-ws-line px-3 py-1.5 text-sm leading-snug text-ws-ink outline-none placeholder:text-ws-muted/60 focus:border-ws-teal"
      />
    </div>
  );
}

export function ReportForm({
  nameTag,
  decisionSummary,
  initial,
}: {
  nameTag: React.ReactNode;
  decisionSummary: string | null;
  initial: ReportValues | undefined;
}) {
  const [values, setValues] = useState<ReportValues>({ ...EMPTY_REPORT, ...initial });
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  const set = (patch: Partial<ReportValues>) => {
    setValues((v) => ({ ...v, ...patch }));
  };

  const save = async (v: ReportValues) => {
    // excursion は homework 内の1キーとして丸ごと上書きされるため、report だけを
    // 送ると decision（AI対話での決定）が消えてしまう。ここで一緒に送り直す。
    const res = await fetch("/api/workshop/me/homework", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        excursion: {
          stage: "report",
          decision: decisionSummary ? { summary: decisionSummary } : null,
          report: v,
        },
      }),
    });
    return res.ok;
  };

  const { status, saveNow } = useAutosave(values, save);

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setCropSrc(url);
    if (fileRef.current) fileRef.current.value = "";
  };

  const closeCrop = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setCropSrc(null);
  };

  const onCropped = async (blob: Blob) => {
    closeCrop();
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", new File([blob], "photo.jpg", { type: "image/jpeg" }));
      const res = await fetch("/api/workshop/me/homework/excursion/photo", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.url) {
        set({ photo: d.url });
      } else {
        alert(d.error ?? "アップロードに失敗しました。");
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <PrintSheet>
      <SheetHeader no={7} accent="プチ越境体験" title="計画と実施レポート" right={nameTag} />

      <p className="mt-2 text-sm text-ws-muted">
        実際にやってみたら、気づいたことをそのまま書き留めましょう。
      </p>

      <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
        <div className="space-y-4">
          <Field
            label="ふだんとは違う環境"
            value={values.place ?? ""}
            onChange={(v) => set({ place: v })}
            placeholder={"（どういう場所・集まり）\n（なぜプチ越境になりそうか）"}
            rows={4}
          />
          <Field
            label="ふだんとは違う人たち"
            value={values.people ?? ""}
            onChange={(v) => set({ people: v })}
            placeholder={"どんな人たちが、\nどんな行動をしている？"}
            rows={4}
          />
        </div>

        <div>
          <span className="mb-1 block text-sm font-semibold text-ws-teal">
            どんなプチ越境体験だった？
          </span>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={onPickFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className={cn(
              "flex h-[280px] w-full items-center justify-center overflow-hidden rounded-lg border transition",
              values.photo
                ? "border-ws-line"
                : "border-dashed border-ws-line text-ws-muted hover:border-ws-teal hover:text-ws-teal"
            )}
          >
            {values.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={values.photo}
                alt="プチ越境体験の写真"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex flex-col items-center gap-1.5 text-sm">
                <ImageIcon className="h-6 w-6" />
                {uploading ? "アップロード中..." : "当日の写真・イベントチラシなど"}
              </span>
            )}
          </button>
        </div>

        <Field
          label="プチ越境体験の感想は？"
          value={values.impression ?? ""}
          onChange={(v) => set({ impression: v })}
          placeholder={"（やってみて率直にどう思った？）\n（意外だった点、共感できた点は？）"}
          rows={3}
          className="md:col-span-2"
        />
      </div>

      <HomeworkSaveBar status={status} saveNow={saveNow} />

      {cropSrc && (
        <CropModal
          src={cropSrc}
          aspect={PHOTO_ASPECT}
          cropShape="rect"
          outputWidth={960}
          onCancel={closeCrop}
          onConfirm={(blob) => void onCropped(blob)}
        />
      )}
    </PrintSheet>
  );
}
