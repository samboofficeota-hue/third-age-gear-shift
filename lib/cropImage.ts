export interface PixelArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * 元画像と切り抜き範囲(px)から、指定サイズのJPEG Blobを生成する。
 * 高さを省略すると正方形（プロフィール写真の円形表示など）になる。
 */
export async function getCroppedBlob(
  src: string,
  area: PixelArea,
  outWidth = 600,
  outHeight = outWidth
): Promise<Blob> {
  const image = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = outWidth;
  canvas.height = outHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas not supported");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    outWidth,
    outHeight
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("crop failed"))),
      "image/jpeg",
      0.9
    );
  });
}
