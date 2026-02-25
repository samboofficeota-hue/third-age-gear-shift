import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "ログインしてください。" }, { status: 401 });
  }
  if (session.role !== "admin" && session.role !== "facilitator") {
    return NextResponse.json({ error: "権限がありません。" }, { status: 403 });
  }

  const sessions = await prisma.workshopSession.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { workshopData: true } },
    },
  });

  return NextResponse.json({
    sessions: sessions.map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      isActive: s.isActive,
      createdAt: s.createdAt,
      participantCount: s._count.workshopData,
    })),
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "ログインしてください。" }, { status: 401 });
  }
  if (session.role !== "admin" && session.role !== "facilitator") {
    return NextResponse.json({ error: "権限がありません。" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const code = typeof body.code === "string" ? body.code.trim() : "";

  if (!code) {
    return NextResponse.json({ error: "コードを入力してください。" }, { status: 400 });
  }
  if (!/^[a-zA-Z0-9_-]{4,32}$/.test(code)) {
    return NextResponse.json(
      { error: "コードは英数字・ハイフン・アンダースコアで4〜32文字にしてください。" },
      { status: 400 }
    );
  }

  try {
    const ws = await prisma.workshopSession.create({
      data: { name: name || null, code },
    });
    return NextResponse.json({ session: { id: ws.id, name: ws.name, code: ws.code, isActive: ws.isActive, createdAt: ws.createdAt } }, { status: 201 });
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "このコードはすでに使用されています。" }, { status: 409 });
    }
    console.error("admin/sessions POST:", e);
    return NextResponse.json({ error: "作成に失敗しました。" }, { status: 500 });
  }
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
  const { id, isActive } = body as { id?: string; isActive?: boolean };

  if (!id || typeof isActive !== "boolean") {
    return NextResponse.json({ error: "id と isActive が必要です。" }, { status: 400 });
  }

  const updated = await prisma.workshopSession.update({
    where: { id },
    data: { isActive },
  });

  return NextResponse.json({ session: { id: updated.id, isActive: updated.isActive } });
}
