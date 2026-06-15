import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * ワークシートを並べる画面用ステージ（暗い背景にシートを中央配置）。
 * 印刷時は globals.css の @media print で装飾が外れる。
 */
export function WorksheetStage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("worksheet-stage", className)}>{children}</div>;
}
