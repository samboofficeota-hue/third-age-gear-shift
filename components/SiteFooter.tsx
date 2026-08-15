import { Mail } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

/**
 * 黒い画面(Program A・自学習系)共通フッター。1行。
 * 自宅/会社で各自のタイミングで進める前提のため、事務局への連絡導線を常設する。
 * 研修本番(Program B・白基調・当日運用)には出さない。
 */
export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer
      className={cn(
        "no-print relative mt-16 w-full border-t border-hairline px-4 py-4 text-xs text-muted-foreground md:px-8",
        className
      )}
    >
      <p className="text-center">© {new Date().getFullYear()} 株式会社COMMUNITY</p>
      <a
        href={`mailto:${BRAND.contactEmail}`}
        className="absolute right-4 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 text-muted-foreground underline-offset-2 transition-colors hover:text-primary hover:underline md:right-8"
      >
        <Mail className="h-3.5 w-3.5" />
        事務局へ問合わせ
      </a>
    </footer>
  );
}
