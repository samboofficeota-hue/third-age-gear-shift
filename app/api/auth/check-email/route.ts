import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * 招待制のため、マジックリンクを送る前に「事務局が事前登録したメールアドレスか」を確認する。
 * 未登録なら送信せず、事務局への問い合わせを案内する。
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email) {
    return NextResponse.json({ error: "メールアドレスを入力してください。" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });

  return NextResponse.json({ registered: !!user });
}
