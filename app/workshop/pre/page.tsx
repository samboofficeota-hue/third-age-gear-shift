import Link from "next/link";
import { ArrowRight, ClipboardList, UserCircle } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * 事前課題の「扉（ウェルカム）」シート。
 * 参加お礼 → これからの2課題（事前アンケート・自己紹介シート）→ まず事前アンケートへ。
 */
export default async function PrePage() {
  const session = await getSession();
  let name = "";
  if (session) {
    const wd = await prisma.workshopData.findUnique({
      where: { userId: session.sub },
      select: { profile: true },
    });
    const profile = wd?.profile as { name?: string } | null;
    name = profile?.name?.trim() ?? "";
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12 md:px-6">
      <div className="rounded-2xl border border-[rgba(0,255,136,0.2)] bg-[#141a2a] p-6 sm:p-8">
        <p className="text-lg font-bold text-[#e0f0e8]">
          {name ? `${name}さん、こんにちは。` : "こんにちは。"}
        </p>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-[#c8dccf]">
          <p>
            この度は「サードエイジ じぶん戦略講座」にご参加をいただけるとのこと。
            誠にありがとうございます。
          </p>
          <p>
            ご参加に先立って、次の2つへの記入をお願いいたします。
          </p>
        </div>

        <ol className="mt-5 space-y-2">
          <li className="flex items-center gap-3 rounded-lg border border-[rgba(0,255,136,0.15)] bg-[#0f1420] px-4 py-3">
            <ClipboardList className="h-5 w-5 shrink-0 text-primary" />
            <span className="text-sm font-medium text-[#e0f0e8]">事前アンケート</span>
            <span className="ml-auto text-[11px] text-muted-foreground">所要 約5分</span>
          </li>
          <li className="flex items-center gap-3 rounded-lg border border-[rgba(0,255,136,0.15)] bg-[#0f1420] px-4 py-3">
            <UserCircle className="h-5 w-5 shrink-0 text-primary" />
            <span className="text-sm font-medium text-[#e0f0e8]">自己紹介シート</span>
            <span className="ml-auto text-[11px] text-muted-foreground">Day1で発表</span>
          </li>
        </ol>

        <p className="mt-5 text-sm text-[#c8dccf]">
          まずは、<span className="font-bold text-primary">事前アンケート</span>からお願いします。
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/workshop/pre/survey"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:bg-[#00cc6a]"
          >
            事前アンケートに進む
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/workshop/pre/profile-slide"
            className="text-center text-xs text-muted-foreground hover:text-[#e0f0e8]"
          >
            先に自己紹介シートを見る
          </Link>
        </div>
      </div>

      <div className="mt-4 text-center">
        <Link
          href="/workshop"
          className="text-xs text-muted-foreground hover:text-[#e0f0e8]"
        >
          ← ダッシュボードへ戻る
        </Link>
      </div>
    </div>
  );
}
