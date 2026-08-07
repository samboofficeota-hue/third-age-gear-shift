import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { generateInviteToken, buildInviteUrl, isValidEmail } from "@/lib/invite";

/**
 * 招待作成（A-3 / T-1）。参加者を事前登録し、アクティベーション用トークンを発行する。
 *
 * ここでは**メール送信は行わない**（Resend未導入）。発行された招待URLを返すので、
 * 事務局が内容を確認してから送信フェーズ（P-1）に進む。
 * 1件でも複数件（CSV貼り付け）でも同じ形で受ける。
 */

type InviteRow = {
  name?: unknown;
  email?: unknown;
  department?: unknown;
  organizationId?: unknown;
  organizationName?: unknown;
};

type RowResult = {
  email: string;
  name: string | null;
  status: "created" | "reissued" | "skipped" | "error";
  reason?: string;
  inviteUrl?: string;
};

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => ({}));
  const sessionId = str(body.sessionId);
  const rows: InviteRow[] = Array.isArray(body.participants) ? body.participants : [];

  if (!sessionId) {
    return NextResponse.json({ error: "研修セッションを選択してください。" }, { status: 400 });
  }
  if (rows.length === 0) {
    return NextResponse.json({ error: "登録する参加者がいません。" }, { status: 400 });
  }
  if (rows.length > 200) {
    return NextResponse.json(
      { error: "一度に登録できるのは200名までです。" },
      { status: 400 }
    );
  }

  const workshopSession = await prisma.workshopSession.findUnique({
    where: { id: sessionId },
  });
  if (!workshopSession) {
    return NextResponse.json({ error: "セッションが見つかりません。" }, { status: 404 });
  }

  // 会社名は都度 findFirst せず、この呼び出し内でキャッシュする
  const orgCache = new Map<string, string>();
  async function resolveOrganizationId(row: InviteRow): Promise<string | null> {
    const id = str(row.organizationId);
    if (id) return id;
    const name = str(row.organizationName);
    if (!name) return null;
    const cached = orgCache.get(name);
    if (cached) return cached;
    const existing = await prisma.organization.findFirst({ where: { name } });
    const org = existing ?? (await prisma.organization.create({ data: { name } }));
    orgCache.set(name, org.id);
    return org.id;
  }

  const results: RowResult[] = [];

  for (const row of rows) {
    const email = str(row.email).toLowerCase();
    const name = str(row.name) || null;
    const department = str(row.department) || null;

    if (!email) {
      results.push({ email: "", name, status: "error", reason: "メールアドレスが空です" });
      continue;
    }
    if (!isValidEmail(email)) {
      results.push({ email, name, status: "error", reason: "メールアドレスの形式が不正です" });
      continue;
    }

    try {
      const organizationId = await resolveOrganizationId(row);
      const existing = await prisma.user.findUnique({ where: { email } });

      // すでに本人がパスワードを設定済み＝招待し直さない（上書き事故を防ぐ）
      if (existing?.activatedAt) {
        results.push({
          email,
          name: existing.name ?? name,
          status: "skipped",
          reason: "すでにアカウント有効化済みです",
        });
        continue;
      }

      const token = generateInviteToken();

      if (existing) {
        // 未アクティベーションの招待済みユーザー＝トークンを再発行して情報を更新
        const updated = await prisma.user.update({
          where: { id: existing.id },
          data: {
            name: name ?? existing.name,
            department: department ?? existing.department,
            organizationId: organizationId ?? existing.organizationId,
            inviteToken: token,
            invitedAt: new Date(),
          },
        });
        await prisma.workshopData.upsert({
          where: { userId: updated.id },
          update: { sessionId },
          create: { userId: updated.id, sessionId, completedPhases: [] },
        });
        results.push({
          email,
          name: updated.name,
          status: "reissued",
          reason: "招待リンクを再発行しました",
          inviteUrl: buildInviteUrl(token),
        });
        continue;
      }

      const created = await prisma.user.create({
        data: {
          email,
          name,
          department,
          organizationId,
          role: "participant",
          inviteToken: token,
          invitedAt: new Date(),
          workshopData: { create: { sessionId, completedPhases: [] } },
        },
      });
      results.push({
        email,
        name: created.name,
        status: "created",
        inviteUrl: buildInviteUrl(token),
      });
    } catch (e) {
      console.error("admin/invites row:", email, e);
      results.push({ email, name, status: "error", reason: "登録に失敗しました" });
    }
  }

  const summary = {
    requested: rows.length,
    created: results.filter((r) => r.status === "created").length,
    reissued: results.filter((r) => r.status === "reissued").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    error: results.filter((r) => r.status === "error").length,
  };

  return NextResponse.json({ summary, results }, { status: 201 });
}
