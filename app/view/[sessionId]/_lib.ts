import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isAdminInDb } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";

/**
 * 投影ビュー（/view）の共通ガードとデータ取得。
 *
 * 権限は2層なので、開けるのは admin のみ（受講生は自分の画面しか見られない）。
 * ここは閲覧専用の入口で、更新系は一切置かない。
 */

async function requireAdminOrRedirect(to: string) {
  const session = await getSession();
  if (!session) redirect(`/login?from=${to}`);
  // ここは API を介さずサーバー側で直接 Prisma を引く画面なので、
  // キャッシュされた session.role ではなく DB を正として判定する（lib/adminAuth.ts 参照）。
  if (!(await isAdminInDb(session.sub))) redirect("/");
  return session;
}

/** 投影の起点＝研修と、その受講生一覧 */
export async function loadSessionForView(sessionId: string) {
  await requireAdminOrRedirect(`/view/${sessionId}`);

  const workshopSession = await prisma.workshopSession.findUnique({
    where: { id: sessionId },
    select: { id: true, name: true, code: true, day1Date: true, day2Date: true },
  });
  if (!workshopSession) notFound();

  const participants = await prisma.user.findMany({
    where: { role: "participant", workshopData: { sessionId } },
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
      organization: { select: { name: true } },
      workshopData: { select: { completedPhases: true, pre: true } },
    },
    orderBy: { name: "asc" },
  });

  return { workshopSession, participants };
}

/** 1人の受講生を、その画面ごと見るための読み込み */
export async function loadParticipantForView(sessionId: string, userId: string) {
  await requireAdminOrRedirect(`/view/${sessionId}/${userId}`);

  const user = await prisma.user.findFirst({
    where: { id: userId, role: "participant", workshopData: { sessionId } },
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
      organization: { select: { name: true } },
      workshopData: {
        select: { pre: true, homework: true, completedPhases: true },
      },
    },
  });
  if (!user) notFound();

  // 投影中に「戻る」を押したら、講師画面（受講生カードの投影ページ）まで戻る。
  // 管理画面まで戻してしまうと、投影中に管理UIがスクリーンに出てしまう。
  const backTo = `/view/${sessionId}`;

  return { user, backTo };
}
