"use client";

import { useEffect, useState } from "react";

/** 円形の写真枠（読み込み失敗時はプレースホルダ＋ヒント表示） */
export function PhotoFrame({ src }: { src?: string }) {
  const [err, setErr] = useState(false);
  useEffect(() => setErr(false), [src]);
  return (
    <div className="relative mx-auto flex aspect-square w-[300px] items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-ws-line bg-ws-fill">
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
