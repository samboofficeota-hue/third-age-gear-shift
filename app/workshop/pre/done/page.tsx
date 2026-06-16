import Link from "next/link";
import { CheckCircle2, CalendarDays, ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

type ProfileSlide = {
  name?: string;
  nickname?: string;
  points?: string[];
  photo?: string;
};

/**
 * 事前課題の提出完了「ありがとう」ページ。
 * 提出された自己紹介（写真・ニックネーム・3つのポイント）を添えて、
 * パーソナルにお礼 → 研修当日（Day1）を楽しみに、のメッセージ。
 */
export default async function PreDonePage() {
  const session = await getSession();
  let name = "";
  let slide: ProfileSlide | undefined;
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
    slide = (user?.workshopData?.pre as { profileSlide?: ProfileSlide } | null)
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

  const nickname = slide?.nickname?.trim() ?? "";
  const slideName = slide?.name?.trim() ?? name;
  const points = (slide?.points ?? []).filter((p) => p?.trim());
  const photo = slide?.photo?.trim() ?? "";

  return (
    <div className="mx-auto max-w-xl px-4 py-14 md:px-6">
      <div className="rounded-2xl border border-[rgba(0,255,136,0.2)] bg-[#141a2a] p-7 text-center sm:p-9">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
          <CheckCircle2 className="h-8 w-8 text-primary" />
        </div>

        <h1 className="mt-5 text-xl font-bold text-[#e0f0e8]">
          {name ? `${name}さん、` : ""}事前課題のご提出
          <br className="sm:hidden" />
          ありがとうございました！
        </h1>

        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-[#c8dccf]">
          すてきな自己紹介を受け取りました。
          <br />
          Day1で、メンバーのみなさんにご紹介しますね。
        </p>

        {/* 提出された自己紹介プレビュー */}
        {(photo || nickname || slideName || points.length > 0) && (
          <div className="mt-6 rounded-xl border border-[rgba(0,255,136,0.15)] bg-[#0f1420] p-5 text-left">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border border-[rgba(0,255,136,0.25)] bg-[#1a2030]">
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo}
                    alt="プロフィール写真"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                    写真
                  </div>
                )}
              </div>
              <div className="min-w-0">
                {nickname && (
                  <p className="truncate text-lg font-bold text-primary">
                    {nickname}
                  </p>
                )}
                {slideName && (
                  <p className="truncate text-sm text-[#e0f0e8]">{slideName}</p>
                )}
              </div>
            </div>

            {points.length > 0 && (
              <ul className="mt-4 space-y-2 border-t border-[rgba(255,255,255,0.06)] pt-4">
                {points.map((p, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                    <span className="text-sm leading-relaxed text-[#c8dccf]">
                      {p}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="mt-6 space-y-3 text-sm leading-relaxed text-[#c8dccf]">
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
            href="/workshop/pre/profile-slide"
            className="inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-[#e0f0e8]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            自己紹介シートを見直す
          </Link>
        </div>
      </div>
    </div>
  );
}
