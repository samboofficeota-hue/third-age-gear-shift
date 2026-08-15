import Link from "next/link";
import { ArrowRight, CheckCircle2, CalendarDays } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NavigatorMessage } from "./NavigatorMessage";

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

  const hasProfile = photo || nickname || slideName || points.length > 0 || workRows.length > 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 md:px-6">
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </span>
            <h1 className="text-xl font-bold text-foreground">
              {name ? `${name}さん、` : ""}事前課題のご提出ありがとうございました！
            </h1>
          </div>

          <p className="mt-1.5 whitespace-nowrap text-sm leading-relaxed text-secondary-foreground">
            すてきな自己紹介を受け取りました。自己紹介シートは Day1 で発表いただきます。当日まで修正可能です。
          </p>
        </div>

        <div className={cn("mt-8 gap-4", hasProfile ? "grid md:grid-cols-2 md:items-start" : "mx-auto max-w-md")}>
          {/* 左カラム：提出された自己紹介プレビュー */}
          {hasProfile && (
            <div className="rounded-xl border border-border bg-bg-panel p-4 text-left">
              <div className="flex items-center gap-4">
                {/* 写真＋名前 */}
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-border bg-card">
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photo}
                      alt="プロフィール写真"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-caption text-muted-foreground">
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
                    <p className="truncate text-sm text-foreground">{slideName}</p>
                  )}
                </div>

                {/* 右側：会社名／組織名／役割名（今の会社シートより） */}
                {workRows.length > 0 && (
                  <div className="ml-auto min-w-0 space-y-1 border-l border-hairline pl-4">
                    {workRows.map((r) => (
                      <p key={r.label} className="text-xs leading-snug">
                        <span className="text-muted-foreground">{r.label}　</span>
                        <span className="text-foreground">{r.value}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {points.length > 0 && (
                <ul className="mt-3 space-y-1.5 border-t border-hairline pt-3">
                  {points.map((p, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-caption font-bold text-primary-foreground">
                        {i + 1}
                      </span>
                      <span className="text-sm leading-relaxed text-secondary-foreground">
                        {p}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* 右カラム：AIナビゲーターのメッセージ＋Day1案内 */}
          <div className="flex flex-col gap-3">
            <NavigatorMessage initial={aiWelcome} />

            {day1Str && (
              <div className="inline-flex items-center gap-2 self-start rounded-lg border border-border bg-bg-panel px-4 py-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  Day1：{day1Str}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex justify-center border-t border-hairline pt-4">
          <Button asChild>
            <Link href="/workshop/guide">
              研修ガイドへ戻る
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
