import type { ReactNode } from "react";

/**
 * 見出し右に出す共通の氏名表記「ニックネーム（お名前）」。
 * ニックネーム未記入ならお名前のみ。どちらも無ければ空文字。
 * 全ワークシート共通（じぶん紹介／Day1／Day2…）でこれを使う。
 */
export function formatHeaderName(name?: string, nickname?: string): string {
  const nm = (name ?? "").trim();
  const nk = (nickname ?? "").trim();
  if (nk && nm) return `${nk}（${nm}）`;
  return nm || nk;
}

/** 見出し右スロット用の氏名ノード（共通スタイル）。氏名が無ければ null。 */
export function HeaderName({
  name,
  nickname,
}: {
  name?: string;
  nickname?: string;
}) {
  const label = formatHeaderName(name, nickname);
  return label ? (
    <span className="text-base font-bold text-ws-ink">{label}</span>
  ) : null;
}

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
