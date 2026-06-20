"use client";

import type { ReactNode } from "react";
import { PrintSheet } from "@/components/worksheet/PrintSheet";
import { SheetHeader } from "@/components/worksheet/SheetHeader";

/** じぶん紹介の冒頭ルールページ（発表時間／目的／内容） */
export function RuleSheet({ preTag }: { preTag: ReactNode }) {
  return (
    <PrintSheet>
      <SheetHeader no={1} accent="じぶん" title="紹介" right={preTag} />
      <div className="mt-10 rounded-2xl bg-ws-mint p-10">
        <span className="inline-block rounded-full border border-ws-teal bg-white px-4 py-1 text-sm font-semibold text-ws-teal">
          ルール
        </span>
        <dl className="mt-8 space-y-7 text-ws-ink">
          <div className="flex gap-8">
            <dt className="w-32 shrink-0 font-bold">● 発表時間</dt>
            <dd>
              <span className="text-2xl font-bold text-ws-accent">5分以内</span>
              <span className="ml-2 text-sm text-ws-muted">
                （1ページ 1分以内を目安に）
              </span>
            </dd>
          </div>
          <div className="flex gap-8">
            <dt className="w-32 shrink-0 font-bold">● 目的</dt>
            <dd className="space-y-1.5 leading-relaxed">
              <p>
                他のメンバーに <span className="font-bold text-ws-accent">わたし</span> のことを知ってもらうこと
              </p>
              <p>
                自分で <span className="font-bold text-ws-accent">わたし</span> について掘り下げてみること
              </p>
            </dd>
          </div>
          <div className="flex gap-8">
            <dt className="w-32 shrink-0 font-bold">● 内容</dt>
            <dd className="space-y-1.5 leading-relaxed">
              <p>知ってほしい 3つのポイント</p>
              <p>生い立ち</p>
              <p>今の会社・今の仕事</p>
            </dd>
          </div>
        </dl>
      </div>
    </PrintSheet>
  );
}
