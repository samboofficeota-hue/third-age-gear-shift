import { prisma } from "@/lib/db";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";

/** 権限は2層のみ。運営（事務局・講師）は admin、受講する人が participant。 */
export type UserRole = "admin" | "participant";

export type SessionPayload = {
  sub: string; // userId（public.users.id）
  email: string;
  role: UserRole;
};

/**
 * Supabase Auth の app_metadata に role・内部userId(sub)を同期する。
 * middleware が DB を引かずに role 判定できるようにするため。
 */
async function syncAuthMetadata(authUserId: string, data: { role: UserRole; sub: string }) {
  const admin = getSupabaseAdminClient();
  const { error } = await admin.auth.admin.updateUserById(authUserId, {
    app_metadata: { role: data.role, sub: data.sub },
  });
  if (error) {
    console.error("syncAuthMetadata:", error);
  }
}

/**
 * Supabase Auth のユーザー（authUserId）と、既存の public.users を紐付ける。
 * - authUserId で既に紐付け済み → そのまま
 * - email で既存行がある（招待済み参加者・事務局など） → authUserId を埋めて紐付け（初回なら activatedAt も）
 * - どちらもない → 新規 participant を作成（自己登録相当）
 * 最後に role・内部id を app_metadata に同期する。
 */
export async function linkOrCreateUserForAuthId({
  authUserId,
  email,
}: {
  authUserId: string;
  email: string;
}): Promise<{ id: string; role: UserRole }> {
  const normalizedEmail = email.trim().toLowerCase();

  let user = await prisma.user.findUnique({ where: { authUserId } });

  if (!user) {
    const byEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (byEmail) {
      user = await prisma.user.update({
        where: { id: byEmail.id },
        data: {
          authUserId,
          activatedAt: byEmail.activatedAt ?? new Date(),
        },
      });
    }
  }

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        authUserId,
        activatedAt: new Date(),
      },
    });
  }

  const role = user.role as UserRole;
  await syncAuthMetadata(authUserId, { role, sub: user.id });

  return { id: user.id, role };
}

/**
 * 現在のセッションを取得する。Supabase Auth のセッションが無ければ null。
 * role/内部id は app_metadata から読む（無ければ自己修復して埋める）。
 */
export async function getSession(): Promise<SessionPayload | null> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) return null;

  const metaRole = user.app_metadata?.role as UserRole | undefined;
  const metaSub = user.app_metadata?.sub as string | undefined;

  if (metaRole && metaSub) {
    return { sub: metaSub, email: user.email, role: metaRole };
  }

  const linked = await linkOrCreateUserForAuthId({ authUserId: user.id, email: user.email });
  return { sub: linked.id, email: user.email, role: linked.role };
}
