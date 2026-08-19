import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getStorageAdmin, PHOTO_BUCKET } from "@/lib/supabaseStorage";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

/**
 * プチ越境体験レポート用の写真アップロード（認証必須・トリミングなし）。
 * /api/workshop/me/photo（プロフィール写真）と同じ Storage バケット・配信経路を使う。
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "ログインしてください。" }, { status: 401 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "ファイルがありません。" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "画像は5MB以内にしてください。" }, { status: 413 });
  }
  const ext = EXT[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "PNG / JPEG / WebP の画像をご利用ください。" },
      { status: 415 }
    );
  }

  try {
    const admin = getStorageAdmin();
    const path = `${session.sub}/excursion.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error } = await admin.storage
      .from(PHOTO_BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: true });
    if (error) {
      console.error("excursion photo upload:", error.message);
      return NextResponse.json({ error: "アップロードに失敗しました。" }, { status: 500 });
    }
    return NextResponse.json({ url: `/api/photo/${path}?v=${Date.now()}` });
  } catch (e) {
    console.error("excursion photo upload:", e);
    return NextResponse.json(
      { error: "アップロードに失敗しました（設定を確認してください）。" },
      { status: 500 }
    );
  }
}
