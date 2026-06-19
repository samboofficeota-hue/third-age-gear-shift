import { redirect } from "next/navigation";
import { canAccessPhase } from "@/lib/workshopAccess";
import { HomeworkClient } from "./HomeworkClient";

/**
 * 宿題（みらいシナリオ・Program B）。講師が開放したときのみアクセス可。
 * 会社編／社会編の穴埋めシナリオ。保存後は「文章で見る」でボックスを消して表示。
 */
export default async function HomeworkPage() {
  const { ok } = await canAccessPhase("homework");
  if (!ok) redirect("/training");

  return <HomeworkClient />;
}
