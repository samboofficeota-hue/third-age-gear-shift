"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { getCroppedBlob, type PixelArea } from "@/lib/cropImage";

/**
 * 画像の位置調整・拡大縮小（円形プレビュー）モーダル。
 * onConfirm に正方形クロップ済みの Blob と、再調整用のクロップ範囲(％)を返す。
 * initialArea を渡すと前回の枠取りを復元する。
 */
export function CropModal({
  src,
  initialArea,
  onCancel,
  onConfirm,
}: {
  src: string;
  initialArea?: Area | null;
  onCancel: () => void;
  onConfirm: (blob: Blob, area: Area) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<PixelArea | null>(null);
  const [percent, setPercent] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const onComplete = useCallback((pct: Area, px: PixelArea) => {
    setArea(px);
    setPercent(pct);
  }, []);

  const confirm = async () => {
    if (!area || !percent) return;
    setBusy(true);
    try {
      const blob = await getCroppedBlob(src, area);
      onConfirm(blob, percent);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl border border-[rgba(0,255,136,0.2)] bg-[#141a2a] p-5">
        <p className="mb-3 text-sm font-semibold text-[#e0f0e8]">
          写真の位置・大きさを調整
        </p>
        <div className="relative h-72 w-full overflow-hidden rounded-lg bg-black">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            initialCroppedAreaPercentages={initialArea ?? undefined}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onComplete}
          />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs text-[#a0c0b0]">小</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-[#00ff88]"
            aria-label="拡大縮小"
          />
          <span className="text-xs text-[#a0c0b0]">大</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          ドラッグで位置調整、スライダーで拡大縮小できます。
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={busy}>
            キャンセル
          </Button>
          <Button onClick={confirm} disabled={busy}>
            {busy ? "処理中..." : "この範囲で決定"}
          </Button>
        </div>
      </div>
    </div>
  );
}
