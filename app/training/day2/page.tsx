import { redirect } from "next/navigation";
import { canAccessPhase } from "@/lib/workshopAccess";
import { Day2Client } from "./Day2Client";

/**
 * Day2（研修本番・Program B）。講師が開放したときのみアクセス可。
 * #8 マイ・ポートフォリオ戦略 2.0→3.0（現在＝Day1／未来を新規作成→比較・シフト記入）。
 */
export default async function Day2Page() {
  const { ok } = await canAccessPhase("day2");
  if (!ok) redirect("/training");

  return <Day2Client />;
}
