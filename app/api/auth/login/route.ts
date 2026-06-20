import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  verifyPassword,
  createToken,
  getCookieName,
  getCookieOptions,
  type SessionPayload,
} from "@/lib/auth";
import {
  checkLoginAttempt,
  clientIpFrom,
  recordLoginFailure,
  recordLoginSuccess,
} from "@/lib/rateLimit";

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

    const ip = clientIpFrom(request.headers);
    const gate = checkLoginAttempt(email, ip);
    if (!gate.ok) {
      return NextResponse.json(
        {
          error:
            "試行回数の上限に達しました。しばらく時間をおいてから再度お試しください。",
        },
        {
          status: 429,
          headers: { "Retry-After": String(gate.retryAfterSec) },
        }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      recordLoginFailure(email, ip);
      return NextResponse.json(
        { error: "メールアドレスまたはパスワードが正しくありません。" },
        { status: 401 }
      );
    }

    // パスワード未設定（招待中で未アクティベーション）またはゲストはログイン不可
    if (!user.passwordHash || user.passwordHash === "GUEST_NO_LOGIN") {
      return NextResponse.json(
        {
          error:
            "まだ登録が完了していません。招待メールのリンクからパスワードを設定してください。",
        },
        { status: 401 }
      );
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      recordLoginFailure(email, ip);
      return NextResponse.json(
        { error: "メールアドレスまたはパスワードが正しくありません。" },
        { status: 401 }
      );
    }

    recordLoginSuccess(email);

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
