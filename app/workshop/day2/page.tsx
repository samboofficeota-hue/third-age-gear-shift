import { redirect } from "next/navigation";
import { canAccessPhase } from "@/lib/workshopAccess";
import { WorksheetPlaceholder } from "@/components/worksheet/WorksheetPlaceholder";

export default async function Day2Page() {
  const { ok } = await canAccessPhase("day2");
  if (!ok) redirect("/workshop");

  return (
    <WorksheetPlaceholder
      phaseLabel="DAY 2"
      title="ビジョン・資本戦略・シフト戦略"
      note="ビジョン策定／資本戦略（Wish-Can-Shall）／シフト戦略（改良後に追加）"
    />
  );
}
