"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * ブラウザ印刷ダイアログを開く（=「PDFに保存」でPDF出力）。
 * 追加ライブラリ不要。画面のみ表示（印刷では .no-print で消える）。
 */
export function PrintButton({
  label = "PDFで保存 / 印刷",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      className={cn("no-print gap-2", className)}
      onClick={() => window.print()}
    >
      <Printer className="h-4 w-4" />
      {label}
    </Button>
  );
}
