import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, resolveSession } from "@/lib/adminAuth";
import { PHASE_IDS } from "@/lib/phases";
import type { SessionPayload } from "@/lib/auth";

const BLOCK_IDS = PHASE_IDS;

/**
 * 対象セッションを決める。講師は担当分のみ（resolveSession）。
 * セッションが1件も無い状態は事務局の初回セットアップだけなので、admin のときだけ自動作成する。
 */
async function resolveOrBootstrapSession(
  session: SessionPayload,
  sessionId: string | null
) {
  const found = await resolveSession(sessionId);
  if (found) return found;
  if (sessionId || session.role !== "admin") return null;

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return prisma.workshopSession.create({
    data: { name: "デフォルトセッション", code: `session${today}` },
  });
}

export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(request.url);
  const ws = await resolveOrBootstrapSession(
    guard.session,
    searchParams.get("sessionId")
  );
  if (!ws) {
    return NextResponse.json(
      { error: "セッションが見つからないか、閲覧権限がありません。" },
      { status: 404 }
    );
  }

  const blockStatuses = await prisma.blockStatus.findMany({
    where: { sessionId: ws.id },
  });

  const blocks = BLOCK_IDS.map((blockId) => {
    const found = blockStatuses.find((b) => b.blockId === blockId);
    return {
      blockId,
      status: found?.status ?? "LOCKED",
      openedAt: found?.openedAt ?? null,
    };
  });

  return NextResponse.json({
    sessionId: ws.id,
    sessionName: ws.name,
    sessionCode: ws.code,
    blocks,
  });
}

export async function PATCH(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => ({}));
  const { blockId, status, sessionId } = body as {
    blockId?: string;
    status?: string;
    sessionId?: string;
  };

  if (!blockId || !status) {
    return NextResponse.json(
      { error: "blockId と status が必要です。" },
      { status: 400 }
    );
  }
  if (!["LOCKED", "PREVIEW", "OPEN", "CLOSED"].includes(status)) {
    return NextResponse.json({ error: "無効なステータスです。" }, { status: 400 });
  }

  const ws = await resolveOrBootstrapSession(guard.session, sessionId ?? null);
  if (!ws) {
    return NextResponse.json(
      { error: "セッションが見つからないか、操作権限がありません。" },
      { status: 404 }
    );
  }

  const updated = await prisma.blockStatus.upsert({
    where: { sessionId_blockId: { sessionId: ws.id, blockId } },
    update: {
      status: status as "LOCKED" | "PREVIEW" | "OPEN" | "CLOSED",
      ...(status === "OPEN"
        ? { openedAt: new Date(), openedBy: guard.session.sub }
        : {}),
    },
    create: {
      sessionId: ws.id,
      blockId,
      status: status as "LOCKED" | "PREVIEW" | "OPEN" | "CLOSED",
      ...(status === "OPEN"
        ? { openedAt: new Date(), openedBy: guard.session.sub }
        : {}),
    },
  });

  // 宿題は「Day1が終了したら始まる」課題。Day1を停止した瞬間に、まだ講師が
  // 触っていなければ（LOCKEDのまま）自動で開放する。すでに講師が手動で
  // 開放/締切/ロックを操作済みなら、その判断を優先して上書きしない。
  const cascaded: { blockId: string; status: "LOCKED" | "PREVIEW" | "OPEN" | "CLOSED" }[] = [];
  if (blockId === "day1" && status === "CLOSED") {
    const homework = await prisma.blockStatus.findUnique({
      where: { sessionId_blockId: { sessionId: ws.id, blockId: "homework" } },
    });
    if (!homework || homework.status === "LOCKED") {
      const openedHomework = await prisma.blockStatus.upsert({
        where: { sessionId_blockId: { sessionId: ws.id, blockId: "homework" } },
        update: { status: "OPEN", openedAt: new Date(), openedBy: guard.session.sub },
        create: {
          sessionId: ws.id,
          blockId: "homework",
          status: "OPEN",
          openedAt: new Date(),
          openedBy: guard.session.sub,
        },
      });
      cascaded.push({ blockId: openedHomework.blockId, status: openedHomework.status });
    }
  }

  return NextResponse.json({
    block: { blockId: updated.blockId, status: updated.status },
    cascaded,
  });
}
