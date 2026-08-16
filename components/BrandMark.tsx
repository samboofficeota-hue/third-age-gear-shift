import Image from "next/image";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";

/**
 * ブランドロゴ（白地の角丸チップに載せる）。
 * 画像の差し替えは `public/strategy-icon.png` の 1 ファイルだけ。
 * サイズは呼び出し側の className（h-/w-）で指定する。
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center overflow-hidden rounded-2xl bg-white p-[2px] shadow-neon-glow",
        className
      )}
    >
      <Image
        src="/strategy-icon.png"
        alt={`${BRAND.name} ロゴ`}
        width={112}
        height={112}
        priority
        className="h-full w-full object-contain"
      />
    </span>
  );
}
