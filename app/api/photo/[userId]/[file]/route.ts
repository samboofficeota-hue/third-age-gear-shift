import { NextResponse } from "next/server";
import { getSession, type SessionPayload } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStorageAdmin, PHOTO_BUCKET } from "@/lib/supabaseStorage";

/**
 * 受講生の顔写真の配信（認証必須）。
 *
 * Storage バケットは非公開。ここでサーバー側が本人性・権限を確認してから
 * service role で取り出して返す。公開URLは発行しない。
 *
 * 閲覧できるのは
 *   - 本人
 *   - 事務局（admin）
 *   - その受講生が属するセッションの担当講師（facilitator）
 */

const FILE_PATTERN = /^(profile|excursion)(-original)?\.(png|jpg|webp)$/;
const ID_PATTERN = /^[A-Za-z0-9_-]+$/;

async function canView(
  session: SessionPayload,
  targetUserId: string
): Promise<boolean> {
  if (session.sub === targetUserId) return true;
  if (session.role === "admin") return true;
  if (session.role === "facilitator") {
    const owned = await prisma.workshopData.findFirst({
      where: { userId: targetUserId, session: { facilitatorId: session.sub } },
      select: { id: true },
    });
    return !!owned;
  }
  return false;
}

export async function GET(
  _request: Request,
  { params }: { params: { userId: string; file: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "ログインしてください。" }, { status: 401 });
  }

  // パストラバーサル防止：想定した形以外は一切受け付けない
  if (!ID_PATTERN.test(params.userId) || !FILE_PATTERN.test(params.file)) {
    return NextResponse.json({ error: "不正なパスです。" }, { status: 400 });
  }

  if (!(await canView(session, params.userId))) {
    // 存在の有無も伏せる
    return NextResponse.json({ error: "見つかりません。" }, { status: 404 });
  }

  const admin = getStorageAdmin();
  const { data, error } = await admin.storage
    .from(PHOTO_BUCKET)
    .download(`${params.userId}/${params.file}`);

  if (error || !data) {
    return NextResponse.json({ error: "見つかりません。" }, { status: 404 });
  }

  const buffer = Buffer.from(await data.arrayBuffer());
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": data.type || "application/octet-stream",
      "Content-Length": String(buffer.length),
      // 個人情報なので共有キャッシュに載せない
      "Cache-Control": "private, no-store",
    },
  });
}
