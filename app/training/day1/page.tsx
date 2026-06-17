import { redirect } from "next/navigation";
import { canAccessPhase } from "@/lib/workshopAccess";
import { Day1Client } from "./Day1Client";

/**
 * Day1（研修本番・Program B）。講師が開放したときのみアクセス可。
 * 参加者のDay1 = じぶん紹介(read-only) ＋ じぶん分解 ＋ じぶん分析（講義は講師画面側）。
 */
export default async function Day1Page() {
  const { ok } = await canAccessPhase("day1");
  if (!ok) redirect("/training");

  return <Day1Client />;
}
