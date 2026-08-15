import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * アンケート（事前・事後）用のレスポンシブ・コンテナ。
 * スマホ対応の流動レイアウト。ワークシート系（A4横固定）とは別系統。
 */
export function SurveyShell({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="min-h-screen py-8">
      <div className={cn("mx-auto w-full max-w-xl px-4 md:px-6", className)}>
        {(title || description) && (
          <header className="mb-6">
            {title && (
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                {title}
              </h1>
            )}
            {description && (
              <p className="mt-2 text-sm leading-relaxed text-secondary-foreground">
                {description}
              </p>
            )}
          </header>
        )}
        <div className="space-y-8">{children}</div>
      </div>
    </div>
  );
}
