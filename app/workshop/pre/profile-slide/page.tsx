import Link from "next/link";
import { PrintSheet } from "@/components/worksheet/PrintSheet";
import { WorksheetStage } from "@/components/worksheet/WorksheetStage";
import { PrintButton } from "@/components/worksheet/PrintButton";

/**
 * じぶん紹介ワークシート — ルールページ（記入ページの手前）。
 * 白地A4横スライド。WORKSHEET_DESIGN.md のガイドライン（ティール構造・マゼンタ強調・ミントのルール枠）を適用。
 * 記入ページ（3ポイント / 生い立ち / 今の会社・仕事）はこの後に追加していく。
 */
export default function ProfileSlidePage() {
  return (
    <WorksheetStage>
      <div className="no-print flex w-full max-w-[1123px] items-center justify-between gap-4">
        <Link
          href="/workshop/pre"
          className="text-sm text-[#a0c0b0] transition-colors hover:text-primary"
        >
          ← 事前課題へ戻る
        </Link>
        <PrintButton />
      </div>

      <PrintSheet>
        {/* ヘッダー：番号バッジ＋タイトル（"じぶん" はマゼンタ強調） */}
        <div className="flex items-center justify-between border-b border-ws-line pb-4">
          <div className="flex items-center gap-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ws-teal text-lg font-bold text-white">
              1
            </span>
            <h1 className="text-3xl font-bold text-ws-ink">
              <span className="text-ws-accent">じぶん</span> 紹介
            </h1>
          </div>
          <span className="text-sm font-semibold text-ws-teal">事前課題</span>
        </div>

        {/* ルール枠（ミント面） */}
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

        <p className="mt-8 text-center text-sm text-ws-muted">
          次のページから順に記入していきます。
        </p>
      </PrintSheet>
    </WorksheetStage>
  );
}
