import Link from "next/link";
import { ArrowRight, ClipboardList, UserCircle } from "lucide-react";

/**
 * 事前課題ハブ（最初から開放）。
 * ① 事前アンケート（スマホ対応）② じぶん紹介ワークシート（A4横）
 */
export default function PrePage() {
  const items = [
    {
      href: "/workshop/pre/survey",
      icon: ClipboardList,
      label: "事前アンケート",
      desc: "所要5分。スマホからも回答できます。",
    },
    {
      href: "/workshop/pre/profile-slide",
      icon: UserCircle,
      label: "じぶん紹介（自己紹介スライド）",
      desc: "Day1で発表します。事前に作成しておきましょう。",
    },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:px-8">
      <Link
        href="/workshop"
        className="text-sm text-[#a0c0b0] transition-colors hover:text-primary"
      >
        ← ダッシュボードへ戻る
      </Link>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-[#e0f0e8]">
        事前課題
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Day1の前に、次の2つに取り組んでください。
      </p>

      <div className="mt-6 space-y-3">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className="flex items-center justify-between gap-4 rounded-xl border border-[rgba(0,255,136,0.25)] bg-[#141a2a] p-4 transition-colors hover:border-primary"
          >
            <div className="flex items-center gap-4">
              <it.icon className="h-6 w-6 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-semibold text-[#e0f0e8]">{it.label}</p>
                <p className="text-xs text-muted-foreground">{it.desc}</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-primary" />
          </Link>
        ))}
      </div>
    </div>
  );
}
