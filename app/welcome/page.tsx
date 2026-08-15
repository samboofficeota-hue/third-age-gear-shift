import Link from "next/link";
import { ClipboardList, UserCircle } from "lucide-react";
import { prisma } from "@/lib/db";
import { ActivateForm } from "./ActivateForm";
import { BRAND } from "@/lib/brand";
import { BrandMark } from "@/components/BrandMark";
import { SiteFooter } from "@/components/SiteFooter";

function WelcomeBrandHeader() {
  return (
    <div className="-mt-5 mb-8 text-center">
      <BrandMark className="mx-auto mb-4 h-14 w-14" />
      <h1 className="text-2xl font-bold tracking-tight text-foreground">{BRAND.name}</h1>
      <p className="subtitle mt-1">{BRAND.tagline}</p>
    </div>
  );
}

function fmtDate(d: Date | null | undefined): string | null {
  if (!d) return null;
  return new Date(d).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * メール招待リンクのランディング（扉）。
 * トークンで本人を特定し、お礼 → メール確認＋パスワード設定でアクティベーション。
 */
export default async function WelcomePage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token?.trim() ?? "";
  const user = token
    ? await prisma.user.findUnique({
        where: { inviteToken: token },
        include: {
          organization: true,
          workshopData: { include: { session: true } },
        },
      })
    : null;

  if (!user || user.activatedAt) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4">
        <WelcomeBrandHeader />
        <div className="w-full rounded-2xl border border-border bg-card p-6 text-center">
          <p className="text-sm text-foreground">
            この招待リンクは無効か、すでに使用されています。
          </p>
          <Link
            href="/login"
            className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
          >
            ログイン画面へ
          </Link>
        </div>
        <SiteFooter className="mt-12" />
      </div>
    );
  }

  const session = user.workshopData?.session;
  const day1 = fmtDate(session?.day1Date);
  const day2 = fmtDate(session?.day2Date);

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <WelcomeBrandHeader />
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <p className="text-lg font-bold text-foreground">
          こんにちは、{user.name ?? "ご参加者"}さん。
        </p>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-secondary-foreground">
          <p>
            この度は「{BRAND.name}」にご参加をいただけるとのこと。
            誠にありがとうございます。
          </p>
          <p>ご参加に先立って、次の2つへの記入をお願いいたします。</p>
        </div>

        <ol className="mt-5 space-y-2">
          <li className="flex items-center gap-3 rounded-lg border border-border bg-bg-panel px-4 py-3">
            <ClipboardList className="h-5 w-5 shrink-0 text-primary" />
            <span className="text-sm font-medium text-foreground">事前アンケート</span>
            <span className="ml-auto text-caption text-muted-foreground">所要 約5分</span>
          </li>
          <li className="flex items-center gap-3 rounded-lg border border-border bg-bg-panel px-4 py-3">
            <UserCircle className="h-5 w-5 shrink-0 text-primary" />
            <span className="text-sm font-medium text-foreground">自己紹介シート</span>
            <span className="ml-auto text-caption text-muted-foreground">Day1で使用</span>
          </li>
        </ol>

        {(day1 || user.organization) && (
          <div className="mt-4 rounded-lg bg-bg-panel px-4 py-3 text-caption leading-relaxed text-muted-foreground">
            {user.organization && <p>所属：{user.organization.name}</p>}
            {(day1 || day2) && (
              <p>
                研修日：{day1}
                {day2 ? `／${day2}` : ""}
              </p>
            )}
          </div>
        )}

        <p className="mt-5 text-sm text-secondary-foreground">
          下のボタンからログインして、
          <span className="font-bold text-primary">事前アンケート</span>からお願いします。
        </p>

        <div className="mt-5">
          <ActivateForm defaultEmail={user.email} />
        </div>
      </div>
      <SiteFooter className="mt-10" />
    </div>
  );
}
