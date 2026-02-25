import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

const BLOCK_IDS = [
  "block_0",
  "block_1",
  "block_2",
  "block_3",
  "block_4",
  "block_5",
  "block_6",
  "block_7",
  "block_8",
];

async function getOrCreateDefaultSession() {
  let ws = await prisma.workshopSession.findFirst({
    orderBy: { createdAt: "desc" },
  });
  if (!ws) {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    ws = await prisma.workshopSession.create({
      data: { name: "デフォルトセッション", code: `session${today}` },
    });
  }
  return ws;
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "ログインしてください。" }, { status: 401 });
  }
  if (session.role !== "admin" && session.role !== "facilitator") {
    return NextResponse.json({ error: "権限がありません。" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  let ws;
  if (sessionId) {
    ws = await prisma.workshopSession.findUnique({ where: { id: sessionId } });
    if (!ws) {
      return NextResponse.json({ error: "セッションが見つかりません。" }, { status: 404 });
    }
  } else {
    ws = await getOrCreateDefaultSession();
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
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "ログインしてください。" }, { status: 401 });
  }
  if (session.role !== "admin" && session.role !== "facilitator") {
    return NextResponse.json({ error: "権限がありません。" }, { status: 403 });
  }

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

  let ws;
  if (sessionId) {
    ws = await prisma.workshopSession.findUnique({ where: { id: sessionId } });
    if (!ws) {
      return NextResponse.json({ error: "セッションが見つかりません。" }, { status: 404 });
    }
  } else {
    ws = await getOrCreateDefaultSession();
  }

  const updated = await prisma.blockStatus.upsert({
    where: { sessionId_blockId: { sessionId: ws.id, blockId } },
    update: {
      status: status as "LOCKED" | "PREVIEW" | "OPEN" | "CLOSED",
      ...(status === "OPEN"
        ? { openedAt: new Date(), openedBy: session.sub }
        : {}),
    },
    create: {
      sessionId: ws.id,
      blockId,
      status: status as "LOCKED" | "PREVIEW" | "OPEN" | "CLOSED",
      ...(status === "OPEN"
        ? { openedAt: new Date(), openedBy: session.sub }
        : {}),
    },
  });

  return NextResponse.json({ block: { blockId: updated.blockId, status: updated.status } });
}
