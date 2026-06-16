import type { ReactNode } from "react";

/**
 * ワークシート各シート共通のヘッダー。
 * 左: ティールの番号バッジ ＋ 見出し（アクセント語＋本文＋補足）
 * 右: フェーズ表示や氏名などの任意スロット
 *
 * デザインガイド（docs/WORKSHEET_DESIGN.md §3）の ws-* トークンに準拠。
 */
export function SheetHeader({
  no,
  accent,
  title,
  sub,
  right,
}: {
  /** 番号バッジ（省略可） */
  no?: number;
  /** マゼンタ強調する語（例: "じぶん"） */
  accent: string;
  /** 見出し本文（例: "紹介"） */
  title: string;
  /** 補足（例: "〜 生い立ち"） */
  sub?: string;
  /** 右上スロット（事前課題ラベル／氏名 など） */
  right?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-ws-line pb-4">
      <div className="flex items-center gap-4">
        {no != null && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ws-teal text-lg font-bold text-white">
            {no}
          </span>
        )}
        <h1 className="text-3xl font-bold text-ws-ink">
          <span className="text-ws-accent">{accent}</span> {title}
          {sub && <span className="text-ws-muted"> {sub}</span>}
        </h1>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}
