import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/BrandMark";
import { BRAND } from "@/lib/brand";

/**
 * トップ（ランディング）。招待制プログラムの入口。
 * スタイルは globals.css の規定（base h1 / .lead / .subtitle / .callout /
 * .brand-chip）とデザイントークンに従う。個別のハードコードはしない。
 */
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-16 text-center">
      <BrandMark className="mb-6 h-16 w-16" />

      <h1>{BRAND.name}</h1>
      <p className="subtitle mt-2">{BRAND.tagline}</p>
      <p className="lead mt-5 max-w-md">
        これまでの経験を棚卸しし、これからの「サードエイジ」を、
        じぶんの言葉で設計していくための講座です。
      </p>

      <div className="mt-9 flex w-full max-w-xs flex-col gap-3">
        <Button asChild size="lg" className="w-full">
          <Link href="/login">
            ログイン
            <ArrowRight />
          </Link>
        </Button>
      </div>

      <div className="callout mt-8 max-w-sm">
        <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-sm leading-relaxed text-muted-foreground">
          ご参加は<span className="font-semibold text-secondary-foreground">招待制</span>です。
          はじめての方は、事務局からの招待メールのリンクからお進みください。
        </p>
      </div>
    </main>
  );
}
