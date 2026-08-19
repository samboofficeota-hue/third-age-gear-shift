import { redirect } from "next/navigation";
import { canAccessPhase } from "@/lib/workshopAccess";
import { AssetForm } from "../AssetForm";

/** じぶん資産表 #3 変身資産。入口は扉ページ（/workshop/homework/assets）から。 */
export default async function AssetsTransformationPage() {
  const { ok } = await canAccessPhase("homework");
  if (!ok) redirect("/workshop/homework");
  return <AssetForm assetKey="transformation" />;
}
