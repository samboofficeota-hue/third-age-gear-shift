import { redirect } from "next/navigation";
import { canAccessPhase } from "@/lib/workshopAccess";
import { getSession } from "@/lib/auth";
import { Day2Client } from "./Day2Client";

/**
 * Day2（研修本番・Program B）。講師が開放したときのみアクセス可。
 * ?mode=view のときは閲覧モード（事後の自分の記録閲覧）。フェーズ開放問わず。
 */
export default async function Day2Page({
  searchParams,
}: {
  searchParams: { mode?: string };
}) {
  const view = searchParams.mode === "view";

  if (view) {
    const session = await getSession();
    if (!session) redirect("/login?from=/training/day2?mode=view");
    return <Day2Client viewOnly />;
  }

  const { ok } = await canAccessPhase("day2");
  if (!ok) redirect("/training");
  return <Day2Client />;
}
