import { BrandMark } from "@/components/BrandMark";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

/**
 * 黒い画面（トップ／ログイン／登録）共通のアイコン＋タイトル＋タグライン。
 * 大きさ・並びはトップページ（app/page.tsx）と揃える（単一の出所）。
 */
export function AuthBrandHeader({ className }: { className?: string }) {
  return (
    <div className={cn("text-center", className)}>
      <BrandMark className="mb-5 h-16 w-16" />
      <h1>{BRAND.name}</h1>
      <p className="subtitle mt-2">{BRAND.tagline}</p>
    </div>
  );
}
