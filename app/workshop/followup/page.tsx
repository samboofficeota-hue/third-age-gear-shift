import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { FollowupSurvey } from "./FollowupSurvey";

/**
 * 近況のお伺い（§F・3ヶ月後フォロー）。
 * メール経由のリンクで開かれる想定。今は認証のみ。時間ゲートは Cron 実装時に追加。
 */
export default async function FollowupPage() {
  const session = await getSession();
  if (!session) redirect("/login?from=/workshop/followup");
  return <FollowupSurvey />;
}
