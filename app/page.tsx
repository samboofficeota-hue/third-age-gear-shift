import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";

/**
 * トップ（ランディング）。
 * 招待制プログラムの入口。世界観はログイン画面（ダーク）に合わせる。
 */
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-16 text-center">
      {/* ロゴ */}
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-3xl text-primary-foreground shadow-md">
        ⚙️
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-[#e0f0e8] sm:text-3xl">
        サードエイジ じぶん戦略講座
      </h1>
      <p className="mt-2 text-sm text-muted-foreground sm:text-base">
        ミドルシニア社員向け　キャリア戦略プログラム
      </p>
      <p className="mt-5 max-w-md text-sm leading-relaxed text-[#c8dccf]">
        これまでの経験を棚卸しし、これからの「サードエイジ」を、
        じぶんの言葉で設計していくための講座です。
      </p>

      {/* CTA */}
      <div className="mt-9 flex w-full max-w-xs flex-col gap-3">
        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition hover:bg-[#00cc6a]"
        >
          ログイン
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* 招待制の案内 */}
      <div className="mt-8 flex max-w-sm items-start gap-2.5 rounded-xl border border-[rgba(0,255,136,0.15)] bg-[#141a2a] px-4 py-3 text-left">
        <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          ご参加は<span className="font-semibold text-[#c8dccf]">招待制</span>です。
          はじめての方は、事務局からの招待メールのリンクからお進みください。
        </p>
      </div>
    </main>
  );
}
