import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/BrandMark";
import { BRAND } from "@/lib/brand";
import { SiteFooter } from "@/components/SiteFooter";

/**
 * トップ（ランディング）。招待制プログラムの入口。
 * スタイルは globals.css の規定（base h1 / .lead / .subtitle / .callout /
 * .brand-chip）とデザイントークンに従う。個別のハードコードはしない。
 */
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-6 text-center">
      <BrandMark className="mb-5 h-16 w-16" />

      <h1>{BRAND.name}</h1>
      <p className="subtitle mt-2">{BRAND.tagline}</p>
      <p className="lead mt-4 max-w-xl">
        これまでの「じぶん」を棚卸して、これからの「じぶん」を描く。
        <br />
        サードエイジへ向けた、「じぶん」の経営戦略をつくっていく講座です。
      </p>

      <div className="mt-7">
        <Button asChild size="lg">
          <Link href="/login">
            ログイン
            <ArrowRight />
          </Link>
        </Button>
      </div>

      <p className="mt-6 whitespace-nowrap text-sm text-muted-foreground">
        この講座は招待制です。お心当たりのない場合は、事務局までお問合せください。
      </p>

      <SiteFooter className="mt-10" />
    </main>
  );
}
