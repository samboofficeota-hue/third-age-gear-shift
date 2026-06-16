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
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="min-h-screen px-4 py-8 sm:px-6">
      <div className={cn("mx-auto w-full max-w-xl", className)}>
        {(title || description) && (
          <header className="mb-7">
            {title && (
              <h1 className="text-2xl font-bold tracking-tight text-[#e0f0e8] sm:text-3xl">
                {title}
              </h1>
            )}
            {description && (
              <p className="mt-3 text-base leading-relaxed text-[#c8dccf]">
                {description}
              </p>
            )}
          </header>
        )}
        <div className="space-y-10">{children}</div>
      </div>
    </div>
  );
}
