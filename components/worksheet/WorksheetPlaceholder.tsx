import Link from "next/link";
import { PrintSheet } from "./PrintSheet";
import { WorksheetStage } from "./WorksheetStage";
import { PrintButton } from "./PrintButton";

/**
 * Step 0 用のワークシート枠組み（プレースホルダ）。
 * A4横シート＋印刷ボタンの動作確認用。Phase B で実フィールドに置き換える。
 */
export function WorksheetPlaceholder({
  phaseLabel,
  title,
  note,
}: {
  phaseLabel: string;
  title: string;
  note?: string;
}) {
  return (
    <WorksheetStage>
      <div className="no-print flex w-full max-w-[1123px] items-center justify-between gap-4">
        <Link
          href="/workshop"
          className="text-sm text-[#a0c0b0] transition-colors hover:text-primary"
        >
          ← ダッシュボードへ戻る
        </Link>
        <PrintButton />
      </div>

      <PrintSheet
        phaseLabel={phaseLabel}
        title={title}
        subtitle="（このシートは枠組みです。設問・入力欄は今後のステップで追加されます）"
      >
        <div className="flex min-h-[480px] items-center justify-center rounded-lg border-2 border-dashed border-stone-300 text-sm text-stone-400">
          {note ?? "ワーク内容は準備中です"}
        </div>
      </PrintSheet>
    </WorksheetStage>
  );
}
