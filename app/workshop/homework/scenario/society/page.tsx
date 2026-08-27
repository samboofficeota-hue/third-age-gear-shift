import { redirect } from "next/navigation";
import { canAccessPhase } from "@/lib/workshopAccess";
import { HomeworkClient } from "../HomeworkClient";

/** みらいシナリオ #1 社会編。入口は扉ページ（/workshop/homework/scenario）から。 */
export default async function ScenarioSocietyPage() {
  const { ok } = await canAccessPhase("homework");
  if (!ok) redirect("/workshop/homework");
  return <HomeworkClient only="society" />;
}
