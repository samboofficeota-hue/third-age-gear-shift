import Link from "next/link";
import { CheckCircle2, CalendarDays, ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MicchiMessage } from "./MicchiMessage";

type ProfileSlide = {
  name?: string;
  nickname?: string;
  points?: string[];
  photo?: string;
  work?: { company?: string; dept?: string; title?: string };
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
  let aiWelcome: string | null = null;
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
    const pre = user?.workshopData?.pre as
      | { profileSlide?: ProfileSlide; aiWelcome?: string }
      | null;
    slide = pre?.profileSlide;
    aiWelcome = pre?.aiWelcome?.trim() ? pre.aiWelcome : null;
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
  const workRows = [
    { label: "会社", value: slide?.work?.company?.trim() },
    { label: "組織", value: slide?.work?.dept?.trim() },
    { label: "役割", value: slide?.work?.title?.trim() },
  ].filter((r) => r.value);

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
        </p>

        {/* 提出された自己紹介プレビュー */}
        {(photo || nickname || slideName || points.length > 0 || workRows.length > 0) && (
          <div className="mt-6 rounded-xl border border-[rgba(0,255,136,0.15)] bg-[#0f1420] p-5 text-left">
            <div className="flex items-center gap-4">
              {/* 写真＋名前 */}
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
              <div className="min-w-0 shrink-0">
                {nickname && (
                  <p className="truncate text-lg font-bold text-primary">
                    {nickname}
                  </p>
                )}
                {slideName && (
                  <p className="truncate text-sm text-[#e0f0e8]">{slideName}</p>
                )}
              </div>

              {/* 右側：会社名／組織名／役割名（今の会社シートより） */}
              {workRows.length > 0 && (
                <div className="ml-auto min-w-0 space-y-1 border-l border-[rgba(255,255,255,0.08)] pl-4">
                  {workRows.map((r) => (
                    <p key={r.label} className="text-xs leading-snug">
                      <span className="text-muted-foreground">{r.label}　</span>
                      <span className="text-[#e0f0e8]">{r.value}</span>
                    </p>
                  ))}
                </div>
              )}
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

        {/* ミッチーからの歓迎メッセージ（AI生成・2行） */}
        <MicchiMessage initial={aiWelcome} />

        <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
          自己紹介シートは Day1 で発表していただきます。当日まで追記・修正できます。
        </p>

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
