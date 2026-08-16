import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff, requireAdmin } from "@/lib/adminAuth";

/** 会社（Organization）管理 A-5。役職定年・定年は「会社の制度情報」。 */

function parseAge(v: unknown): number | null {
  if (v === null || v === "" || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n < 30 || n > 100) return null;
  return Math.trunc(n);
}

export async function GET() {
  const guard = await requireStaff();
  if (!guard.ok) return guard.response;

  const organizations = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { users: true } } },
  });

  return NextResponse.json({
    organizations: organizations.map((o) => ({
      id: o.id,
      name: o.name,
      hasPositionRetirement: o.hasPositionRetirement,
      positionRetirementAge: o.positionRetirementAge,
      hasRetirement: o.hasRetirement,
      retirementAge: o.retirementAge,
      userCount: o._count.users,
    })),
  });
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "会社名を入力してください。" }, { status: 400 });
  }

  const existing = await prisma.organization.findFirst({ where: { name } });
  if (existing) {
    return NextResponse.json(
      { error: "同じ名前の会社がすでに登録されています。" },
      { status: 409 }
    );
  }

  const org = await prisma.organization.create({
    data: {
      name,
      hasPositionRetirement:
        typeof body.hasPositionRetirement === "boolean" ? body.hasPositionRetirement : null,
      positionRetirementAge: parseAge(body.positionRetirementAge),
      hasRetirement: typeof body.hasRetirement === "boolean" ? body.hasRetirement : null,
      retirementAge: parseAge(body.retirementAge),
    },
  });

  return NextResponse.json({ organization: { ...org, userCount: 0 } }, { status: 201 });
}

export async function PATCH(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) {
    return NextResponse.json({ error: "id が必要です。" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if ("hasPositionRetirement" in body) {
    data.hasPositionRetirement =
      typeof body.hasPositionRetirement === "boolean" ? body.hasPositionRetirement : null;
  }
  if ("positionRetirementAge" in body) {
    data.positionRetirementAge = parseAge(body.positionRetirementAge);
  }
  if ("hasRetirement" in body) {
    data.hasRetirement = typeof body.hasRetirement === "boolean" ? body.hasRetirement : null;
  }
  if ("retirementAge" in body) data.retirementAge = parseAge(body.retirementAge);

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "更新する項目がありません。" }, { status: 400 });
  }

  const updated = await prisma.organization.update({ where: { id }, data });
  return NextResponse.json({ organization: updated });
}
