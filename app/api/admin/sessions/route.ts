import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

/** 日付文字列（YYYY-MM-DD）→ Date | null。無効値は undefined（=更新しない） */
function parseDateInput(v: unknown): Date | null | undefined {
  if (v === null || v === "") return null;
  if (typeof v !== "string") return undefined;
  const d = new Date(`${v}T00:00:00+09:00`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function sessionDto(s: {
  id: string;
  name: string | null;
  code: string;
  isActive: boolean;
  createdAt: Date;
  day1Date: Date | null;
  day2Date: Date | null;
  location: string | null;
  isOnline: boolean;
  _count?: { workshopData: number };
}) {
  return {
    id: s.id,
    name: s.name,
    code: s.code,
    isActive: s.isActive,
    createdAt: s.createdAt,
    day1Date: s.day1Date,
    day2Date: s.day2Date,
    location: s.location,
    isOnline: s.isOnline,
    participantCount: s._count?.workshopData ?? 0,
  };
}

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  // 権限は2層。admin は全研修を扱えるので絞り込みは無い。
  const sessions = await prisma.workshopSession.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { workshopData: true } } },
  });

  return NextResponse.json({ sessions: sessions.map(sessionDto) });
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const code = typeof body.code === "string" ? body.code.trim() : "";
  const location = typeof body.location === "string" ? body.location.trim() : "";
  const isOnline = body.isOnline === true;
  const day1Date = parseDateInput(body.day1Date);
  const day2Date = parseDateInput(body.day2Date);

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
      data: {
        name: name || null,
        code,
        location: location || null,
        isOnline,
        day1Date: day1Date ?? null,
        day2Date: day2Date ?? null,
      },
      include: { _count: { select: { workshopData: true } } },
    });
    return NextResponse.json({ session: sessionDto(ws) }, { status: 201 });
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "このコードはすでに使用されています。" }, { status: 409 });
    }
    console.error("admin/sessions POST:", e);
    return NextResponse.json({ error: "作成に失敗しました。" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => ({}));
  const { id } = body as { id?: string };
  if (!id) {
    return NextResponse.json({ error: "id が必要です。" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  if (typeof body.name === "string") data.name = body.name.trim() || null;
  if (typeof body.location === "string") data.location = body.location.trim() || null;
  if (typeof body.isOnline === "boolean") data.isOnline = body.isOnline;
  if ("day1Date" in body) {
    const d = parseDateInput(body.day1Date);
    if (d !== undefined) data.day1Date = d;
  }
  if ("day2Date" in body) {
    const d = parseDateInput(body.day2Date);
    if (d !== undefined) data.day2Date = d;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "更新する項目がありません。" }, { status: 400 });
  }

  try {
    const updated = await prisma.workshopSession.update({
      where: { id },
      data,
      include: {
          _count: { select: { workshopData: true } },
      },
    });
    return NextResponse.json({ session: sessionDto(updated) });
  } catch (e) {
    console.error("admin/sessions PATCH:", e);
    return NextResponse.json({ error: "更新に失敗しました。" }, { status: 500 });
  }
}
