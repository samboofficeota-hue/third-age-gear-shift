import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  verifyPassword,
  createToken,
  getCookieName,
  getCookieOptions,
  type SessionPayload,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "メールアドレスとパスワードを入力してください。" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "メールアドレスまたはパスワードが正しくありません。" },
        { status: 401 }
      );
    }

    // ゲストユーザーはログイン不可
    if (user.passwordHash === "GUEST_NO_LOGIN") {
      return NextResponse.json(
        { error: "メールアドレスまたはパスワードが正しくありません。" },
        { status: 401 }
      );
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { error: "メールアドレスまたはパスワードが正しくありません。" },
        { status: 401 }
      );
    }

    const payload: SessionPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const token = await createToken(payload);

    const res = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });

    const cookieStore = res.cookies;
    cookieStore.set(getCookieName(), token, getCookieOptions());

    return res;
  } catch (e) {
    console.error("auth/login:", e);
    return NextResponse.json(
      { error: "ログイン処理に失敗しました。" },
      { status: 500 }
    );
  }
}
