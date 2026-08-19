import { redirect } from "next/navigation";
import { canAccessPhase } from "@/lib/workshopAccess";
import { AssetForm } from "../AssetForm";

/** じぶん資産表 #1 生産性資産。入口は扉ページ（/workshop/homework/assets）から。 */
export default async function AssetsProductivityPage() {
  const { ok } = await canAccessPhase("homework");
  if (!ok) redirect("/workshop/homework");
  return <AssetForm assetKey="productivity" />;
}
