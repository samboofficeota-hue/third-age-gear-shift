import { redirect } from "next/navigation";
import { canAccessPhase } from "@/lib/workshopAccess";
import { getSession } from "@/lib/auth";
import { Day1Client } from "./Day1Client";

/**
 * Day1（研修本番・Program B）。講師が開放したときのみアクセス可。
 * ?mode=view のときは閲覧モード（事後の自分の記録閲覧）。フェーズ開放問わず。
 */
export default async function Day1Page({
  searchParams,
}: {
  searchParams: { mode?: string };
}) {
  const view = searchParams.mode === "view";

  if (view) {
    const session = await getSession();
    if (!session) redirect("/login?from=/training/day1?mode=view");
    return <Day1Client viewOnly />;
  }

  const { ok } = await canAccessPhase("day1");
  if (!ok) redirect("/training");
  return <Day1Client />;
}
