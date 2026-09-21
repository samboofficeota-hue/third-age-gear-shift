/**
 * 研修セットの解決（server 専用。prisma を使う）。
 * 受講者の WorkshopData → WorkshopSession.contentSetId → ContentSet を引く。
 */

import { prisma } from "@/lib/db";
import { getContentSet } from "@/lib/content/sets";
import type { ContentSet } from "@/lib/content/types";

/** セッションid から研修セットを解決（未紐付けは default） */
export async function getContentSetForSession(
  sessionId: string | null | undefined
): Promise<ContentSet> {
  if (!sessionId) return getContentSet(null);
  const s = await prisma.workshopSession.findUnique({
    where: { id: sessionId },
    select: { contentSetId: true },
  });
  return getContentSet(s?.contentSetId);
}

/** ユーザーid から研修セットを解決（未ログイン相当・未紐付けは default） */
export async function getContentSetForUser(
  userId: string | null | undefined
): Promise<ContentSet> {
  if (!userId) return getContentSet(null);
  const wd = await prisma.workshopData.findUnique({
    where: { userId },
    select: { sessionId: true },
  });
  return getContentSetForSession(wd?.sessionId);
}
