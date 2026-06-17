import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { canAccessPhase } from "@/lib/workshopAccess";

export default async function Day2Page() {
  const { ok } = await canAccessPhase("day2");
  if (!ok) redirect("/training");

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-ws-teal">
        DAY 2
      </p>
      <h1 className="mt-2 text-2xl font-bold text-ws-ink">
        ビジョン・資本・シフト戦略
      </h1>
      <p className="mt-3 text-sm text-ws-muted">このワークは準備中です。</p>
      <Link
        href="/training"
        className="mt-8 inline-flex items-center gap-1.5 text-sm text-ws-teal hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        研修本番トップへ
      </Link>
    </div>
  );
}
