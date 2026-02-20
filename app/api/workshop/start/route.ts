import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

const COOKIE_NAME = "workshop_guest_id";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 14; // 14日

/**
 * Block 0 用：認証なしで参加を開始し、ゲスト User + WorkshopData を作成して Cookie を返す。
 * 認証実装後はこのエンドポイントは廃止し、ログイン後に WorkshopData を紐づける想定。
 */
export async function POST() {
  try {
    const cuid = () =>
      "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    const guestId = cuid();
    const email = `guest_${guestId}@temp.third-age.local`;
    const passwordHash = "GUEST_NO_LOGIN"; // 認証実装までログイン不可

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "participant",
      },
    });

    const workshopData = await prisma.workshopData.create({
      data: {
        userId: user.id,
        sessionId: "default",
        completedBlocks: [],
      },
    });

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, workshopData.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    return NextResponse.json({
      workshopDataId: workshopData.id,
      userId: user.id,
    });
  } catch (e) {
    console.error("workshop/start:", e);
    return NextResponse.json(
      { error: "Failed to start workshop session" },
      { status: 500 }
    );
  }
}
