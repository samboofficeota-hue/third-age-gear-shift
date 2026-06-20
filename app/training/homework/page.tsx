import { redirect } from "next/navigation";
import { canAccessPhase } from "@/lib/workshopAccess";
import { getSession } from "@/lib/auth";
import { HomeworkClient } from "./HomeworkClient";

/**
 * 宿題（みらいシナリオ・Program B）。講師が開放したときのみアクセス可。
 * ?mode=view のときは閲覧モード（事後の自分の記録閲覧）。フェーズ開放問わず。
 */
export default async function HomeworkPage({
  searchParams,
}: {
  searchParams: { mode?: string };
}) {
  const view = searchParams.mode === "view";

  if (view) {
    const session = await getSession();
    if (!session) redirect("/login?from=/training/homework?mode=view");
    return <HomeworkClient viewOnly />;
  }

  const { ok } = await canAccessPhase("homework");
  if (!ok) redirect("/training");
  return <HomeworkClient />;
}
