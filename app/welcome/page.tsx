import Link from "next/link";
import { ClipboardList, UserCircle } from "lucide-react";
import { prisma } from "@/lib/db";
import { ActivateForm } from "./ActivateForm";

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
        <div className="w-full rounded-2xl border border-[rgba(0,255,136,0.2)] bg-[#141a2a] p-6 text-center">
          <p className="text-sm text-[#e0f0e8]">
            この招待リンクは無効か、すでに使用されています。
          </p>
          <Link
            href="/login"
            className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
          >
            ログイン画面へ
          </Link>
        </div>
      </div>
    );
  }

  const session = user.workshopData?.session;
  const day1 = fmtDate(session?.day1Date);
  const day2 = fmtDate(session?.day2Date);

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="rounded-2xl border border-[rgba(0,255,136,0.2)] bg-[#141a2a] p-6 sm:p-8">
        <p className="text-lg font-bold text-[#e0f0e8]">
          こんにちは、{user.name ?? "ご参加者"}さん。
        </p>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-[#c8dccf]">
          <p>
            この度は「サードエイジ じぶん戦略講座」にご参加をいただけるとのこと。
            誠にありがとうございます。
          </p>
          <p>ご参加に先立って、次の2つへの記入をお願いいたします。</p>
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

        {(day1 || user.organization) && (
          <div className="mt-4 rounded-lg bg-[#0f1420] px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
            {user.organization && <p>所属：{user.organization.name}</p>}
            {(day1 || day2) && (
              <p>
                研修日：{day1}
                {day2 ? `／${day2}` : ""}
              </p>
            )}
          </div>
        )}

        <p className="mt-5 text-sm text-[#c8dccf]">
          まずはログイン情報を設定して、
          <span className="font-bold text-primary">事前アンケート</span>からお願いします。
        </p>

        <div className="mt-5">
          <ActivateForm token={token} defaultEmail={user.email} />
        </div>
      </div>
    </div>
  );
}
