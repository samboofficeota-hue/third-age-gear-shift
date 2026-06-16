import Link from "next/link";
import { CheckCircle2, CalendarDays, ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * 事前課題の提出完了「ありがとう」ページ。
 * 氏名でお礼 → 研修当日（Day1）を楽しみに、のメッセージ。
 */
export default async function PreDonePage() {
  const session = await getSession();
  let name = "";
  let day1Str: string | null = null;

  if (session) {
    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: {
        name: true,
        workshopData: {
          select: {
            pre: true,
            session: { select: { day1Date: true } },
          },
        },
      },
    });
    const slide = (user?.workshopData?.pre as { profileSlide?: { name?: string } } | null)
      ?.profileSlide;
    name = (user?.name ?? slide?.name ?? "").trim();

    const day1 = user?.workshopData?.session?.day1Date;
    if (day1) {
      day1Str = new Intl.DateTimeFormat("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "short",
        timeZone: "Asia/Tokyo",
      }).format(day1);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16 md:px-6">
      <div className="rounded-2xl border border-[rgba(0,255,136,0.2)] bg-[#141a2a] p-8 text-center sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
          <CheckCircle2 className="h-9 w-9 text-primary" />
        </div>

        <h1 className="mt-6 text-xl font-bold text-[#e0f0e8]">
          {name ? `${name}さん、` : ""}事前課題のご提出
          <br className="sm:hidden" />
          ありがとうございました！
        </h1>

        <div className="mt-5 space-y-3 text-sm leading-relaxed text-[#c8dccf]">
          <p>
            ご記入いただいた「事前アンケート」と「自己紹介シート」は、
            講師がしっかり目を通します。
          </p>
          <p>
            自己紹介シートは <span className="font-bold text-primary">Day1</span> で
            発表していただきます。当日まで、追記・修正もできます。
          </p>
          <p className="font-bold text-[#e0f0e8]">
            研修当日を、どうぞ楽しみにしていてください。
          </p>
        </div>

        {day1Str && (
          <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-lg border border-[rgba(0,255,136,0.2)] bg-[#0f1420] px-4 py-2.5">
            <CalendarDays className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-[#e0f0e8]">
              Day1：{day1Str}
            </span>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/workshop"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:bg-[#00cc6a]"
          >
            ダッシュボードへ戻る
          </Link>
          <Link
            href="/workshop/pre"
            className="inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-[#e0f0e8]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            事前課題を見直す
          </Link>
        </div>
      </div>
    </div>
  );
}
