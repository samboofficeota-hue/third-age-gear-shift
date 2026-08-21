"use client";

import Link from "next/link";
import { Presentation } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { BLOCK_META } from "../blockMeta";
import { formatTime, type Participant } from "../types";

/**
 * 講師画面（D-2 / F-2）。研修中に進行役が開く一覧。
 * ※ 権限は2層（admin / participant）。この画面を開けるのは admin のみ。
 *
 * ここは事務局が状況を確認するための管理画面。
 * スクリーンに映すのは「投影ページ」（/view/[sessionId]）のほうで、
 * そちらは受講生カードを並べた1ページになっている。
 * 投影を個人ページから始めないのは、投影中に戻ったときへ
 * 管理画面が映り込まないようにするため。
 */
export function TrainerPanel({
  sessionId,
  participants,
}: {
  sessionId: string;
  participants: Participant[];
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="admin-page-title">講師画面</h1>
          <p className="admin-page-note">
            受講生の入力状況を確認できます。研修当日にスクリーンへ出すのは
            「投影ページ」です。表示は受講生の画面と同じもので、閲覧専用です。
          </p>
        </div>
        <Link
          href={`/view/${sessionId}`}
          className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          <Presentation className="h-4 w-4" />
          投影ページを開く
        </Link>
      </div>

      {participants.length === 0 ? (
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">
              受講生がまだ登録されていません。「受講生」タブから追加してください。
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">
                  受講生
                </th>
                {BLOCK_META.map((m) => (
                  <th
                    key={m.id}
                    className="px-2 py-2.5 text-center text-xs font-semibold text-muted-foreground"
                  >
                    {m.shortLabel}
                  </th>
                ))}
                <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground">
                  最終更新
                </th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {participants.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5">
                    <p className="font-medium">{p.name ?? p.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {[p.organizationName, p.department].filter(Boolean).join(" / ") ||
                        p.email}
                    </p>
                  </td>
                  {BLOCK_META.map((m) => {
                    const done = p.completedPhases.includes(m.id);
                    return (
                      <td key={m.id} className="px-2 py-2.5 text-center">
                        <span
                          className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-caption font-bold ${
                            done
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {done ? "✓" : "—"}
                        </span>
                      </td>
                    );
                  })}
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs tabular-nums text-muted-foreground">
                    {formatTime(p.lastUpdated)}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Link
                      href={`/view/${sessionId}/${p.id}`}
                      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-accent"
                    >
                      ワークを見る
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        ✓ は受講生がそのブロックを完了として保存済みであることを示します。
        未完了でも入力途中の内容は投影ビューで確認できます。
      </p>
      {participants.length > 0 && (
        <div className="rounded-xl border border-border bg-accent px-4 py-3 text-sm text-accent-foreground">
          投影ページには受講生の名前がカードで並びます。発表する人のカードを押すと
          その人のワークに入り、「戻る」を押すと投影ページまで戻ります
          （管理画面はスクリーンに映りません）。
        </div>
      )}
    </div>
  );
}
