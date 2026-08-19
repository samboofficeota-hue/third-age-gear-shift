import { redirect } from "next/navigation";
import { canAccessPhase } from "@/lib/workshopAccess";
import { AssetForm } from "../AssetForm";

/** じぶん資産表 #2 活力資産。入口は扉ページ（/workshop/homework/assets）から。 */
export default async function AssetsVitalityPage() {
  const { ok } = await canAccessPhase("homework");
  if (!ok) redirect("/workshop/homework");
  return <AssetForm assetKey="vitality" />;
}
