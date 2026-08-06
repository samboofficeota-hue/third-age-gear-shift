import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  hashPassword,
  createToken,
  getCookieName,
  getCookieOptions,
  type SessionPayload,
} from "@/lib/auth";
import { INVITE_TTL_DAYS, isInviteExpired } from "@/lib/invite";

/**
 * 招待リンク（トークン）から初回アクティベーション。
 * パスワードを設定し、メールを確定して、セッションを発行する。
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!token) {
      return NextResponse.json(
        { error: "招待リンクが無効です。" },
        { status: 400 }
      );
    }
    if (!email) {
      return NextResponse.json(
        { error: "メールアドレスを入力してください。" },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "パスワードは8文字以上で設定してください。" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { inviteToken: token } });
    if (!user || user.activatedAt) {
      return NextResponse.json(
        { error: "この招待リンクは無効か、すでに使用されています。" },
        { status: 410 }
      );
    }
    if (isInviteExpired(user.invitedAt)) {
      return NextResponse.json(
        {
          error: `この招待リンクは有効期限（${INVITE_TTL_DAYS}日）が切れています。お手数ですが事務局までご連絡ください。`,
        },
        { status: 410 }
      );
    }

    // メール変更時は他ユーザーと重複しないか確認
    if (email !== user.email) {
      const other = await prisma.user.findUnique({ where: { email } });
      if (other && other.id !== user.id) {
        return NextResponse.json(
          { error: "このメールアドレスは既に使用されています。" },
          { status: 409 }
        );
      }
    }

    const passwordHash = await hashPassword(password);
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        email,
        activatedAt: new Date(),
        inviteToken: null,
      },
    });

    const payload: SessionPayload = {
      sub: updated.id,
      email: updated.email,
      role: updated.role,
    };
    const jwt = await createToken(payload);

    const res = NextResponse.json({
      user: { id: updated.id, email: updated.email, role: updated.role },
    });
    res.cookies.set(getCookieName(), jwt, getCookieOptions());
    return res;
  } catch (e) {
    console.error("auth/activate:", e);
    return NextResponse.json(
      { error: "登録処理に失敗しました。" },
      { status: 500 }
    );
  }
}
