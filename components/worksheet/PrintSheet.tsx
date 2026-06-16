import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PrintSheetProps {
  /** シート左上の見出し */
  title?: string;
  /** 見出し下の補足 */
  subtitle?: string;
  /** 右上のフェーズ表示（例: Day 1） */
  phaseLabel?: string;
  /** 連番（①②③ など）アイコン */
  badge?: ReactNode;
  /** 下部フッター（ページ番号・氏名など） */
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * A4横スライド型のワークシート1ページ。
 * 画面では 1123×794px の白いシート、印刷では A4横ページに1:1で収まる。
 * 複数ページは <PrintSheet> を複数並べる（globals.css が改ページを付与）。
 */
export function PrintSheet({
  title,
  subtitle,
  phaseLabel,
  badge,
  footer,
  className,
  children,
}: PrintSheetProps) {
  return (
    <section className={cn("print-sheet avoid-break", className)}>
      {(title || phaseLabel) && (
        <header className="mb-6 flex items-start justify-between gap-4 border-b border-ws-line pb-3">
          <div className="flex items-start gap-3">
            {badge && <div className="mt-1 shrink-0">{badge}</div>}
            <div>
              {title && (
                <h1 className="text-2xl font-bold tracking-tight text-ws-ink">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-ws-muted">{subtitle}</p>
              )}
            </div>
          </div>
          {phaseLabel && (
            <span className="shrink-0 whitespace-nowrap text-sm font-semibold text-ws-teal">
              {phaseLabel}
            </span>
          )}
        </header>
      )}

      <div className="text-ws-ink">{children}</div>

      {footer && (
        <footer className="mt-6 border-t border-ws-line pt-3 text-xs text-ws-muted">
          {footer}
        </footer>
      )}
    </section>
  );
}
