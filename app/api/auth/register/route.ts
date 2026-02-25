import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  hashPassword,
  createToken,
  getCookieName,
  getCookieOptions,
  type SessionPayload,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "メールアドレスとパスワードを入力してください。" },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "パスワードは8文字以上で設定してください。" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "このメールアドレスはすでに登録されています。" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, passwordHash, role: "participant" },
    });

    const payload: SessionPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const token = await createToken(payload);

    const res = NextResponse.json({
      user: { id: user.id, email: user.email, role: user.role },
    });
    res.cookies.set(getCookieName(), token, getCookieOptions());

    return res;
  } catch (e) {
    console.error("auth/register:", e);
    return NextResponse.json(
      { error: "登録処理に失敗しました。" },
      { status: 500 }
    );
  }
}
