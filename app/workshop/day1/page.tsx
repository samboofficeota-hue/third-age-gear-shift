import { redirect } from "next/navigation";
import { canAccessPhase } from "@/lib/workshopAccess";
import { WorksheetPlaceholder } from "@/components/worksheet/WorksheetPlaceholder";

export default async function Day1Page() {
  const { ok } = await canAccessPhase("day1");
  if (!ok) redirect("/workshop");

  return (
    <WorksheetPlaceholder
      phaseLabel="DAY 1"
      title="じぶん分解・じぶん分析"
      note="分人シェア／コミュニティポートフォリオ／好き得意マトリクス／はたらくの原点／会社とじぶんの一致点（今後追加）"
    />
  );
}
