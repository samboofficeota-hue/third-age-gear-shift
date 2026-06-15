import { redirect } from "next/navigation";
import { canAccessPhase } from "@/lib/workshopAccess";
import { WorksheetPlaceholder } from "@/components/worksheet/WorksheetPlaceholder";

export default async function HomeworkPage() {
  const { ok } = await canAccessPhase("homework");
  if (!ok) redirect("/workshop");

  return (
    <WorksheetPlaceholder
      phaseLabel="宿題"
      title="みらいシナリオ 〜 2040年のじぶんがいる社会"
      note="#1 Vision（だれが・なにを・どう）／#2 Issue／#3 Reason（今後追加）"
    />
  );
}
