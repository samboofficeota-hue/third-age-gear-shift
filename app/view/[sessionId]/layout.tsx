import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: `講師画面 | ${BRAND.name}`,
};

/**
 * 投影ビューの地。受講生の TrainingLayout（白地・Program B）と同じにして、
 * 投影したときに受講生の画面と見分けがつかない状態にする。
 * ヘッダーは戻り先が階層ごとに変わるので、各ページ側で置く。
 */
export default function ViewLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-ws-fill text-ws-ink">{children}</div>;
}
