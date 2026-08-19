import { redirect } from "next/navigation";
import { canAccessPhase } from "@/lib/workshopAccess";
import { ExcursionClient } from "./ExcursionClient";

/**
 * 宿題(a) プチ越境体験。講師が宿題フェーズを開放したときのみアクセス可。
 * 「AIインタビュー」で体験内容を決め（越境の定義は教えない・Day2で種明かし）、
 * 実際にやってみた後「体験レポート」に記入する2段構成。
 */
export default async function ExcursionPage() {
  const { ok } = await canAccessPhase("homework");
  if (!ok) redirect("/workshop/homework");
  return <ExcursionClient />;
}
