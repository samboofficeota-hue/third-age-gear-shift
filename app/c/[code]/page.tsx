import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/BrandMark";
import { BRAND } from "@/lib/brand";
import { SiteFooter } from "@/components/SiteFooter";
import { prisma } from "@/lib/db";
import { getContentSet } from "@/lib/content";

/**
 * コホート専用ランディング（/c/<研修コード>）。
 * その開催回（WorkshopSession）の名前・ブランド（ContentSet.brand）を出す、
 * トップLPのコホート版。ログインは既存の招待制フローのまま（/login）で、
 * この画面は入口の見た目を回ごとに変えるだけ（認証・登録の仕組みは変えない）。
 */
export default async function CohortLandingPage({
  params,
}: {
  params: { code: string };
}) {
  const code = decodeURIComponent(params.code ?? "").trim();
  const session = code
    ? await prisma.workshopSession.findUnique({
        where: { code },
        select: { name: true, isActive: true, contentSetId: true },
      })
    : null;

  // 該当コードが無い / 非公開なら、汎用の案内に逃がす（存在は明かさない）。
  if (!session || !session.isActive) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4 py-6 text-center">
        <BrandMark className="mb-5 h-16 w-16" />
        <h1>{BRAND.name}</h1>
        <p className="lead mt-4 max-w-xl">
          お探しのページが見つかりませんでした。
          <br />
          お心当たりのない場合は、事務局までお問合せください。
        </p>
        <div className="mt-7">
          <Button asChild size="lg">
            <Link href="/login">
              ログイン
              <ArrowRight />
            </Link>
          </Button>
        </div>
        <SiteFooter className="mt-10" />
      </main>
    );
  }

  const set = getContentSet(session.contentSetId);
  const title = session.name ?? set.brand?.name ?? BRAND.name;
  const tagline = set.brand?.tagline ?? BRAND.tagline;
  const lead =
    set.brand?.lead ??
    "これまでの「じぶん」を棚卸して、これからの「じぶん」を描いていく講座です。";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-6 text-center">
      <BrandMark className="mb-5 h-16 w-16" />

      <h1>{title}</h1>
      <p className="subtitle mt-2">{tagline}</p>
      <p className="lead mt-4 max-w-xl">{lead}</p>

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
