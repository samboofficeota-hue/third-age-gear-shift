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
 * プロフィール写真のアップロード（認証必須）。
 * Supabase Storage の worksheet-photos に保存し、公開URLを返す。
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
    return NextResponse.json(
      { error: "画像は5MB以内にしてください。" },
      { status: 413 }
    );
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
    const path = `${session.sub}/profile.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await admin.storage
      .from(PHOTO_BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: true });
    if (error) {
      console.error("photo upload:", error.message);
      return NextResponse.json(
        { error: "アップロードに失敗しました。" },
        { status: 500 }
      );
    }

    const { data } = admin.storage.from(PHOTO_BUCKET).getPublicUrl(path);
    // upsert で同一パスのため、CDNキャッシュをバストする
    const url = `${data.publicUrl}?v=${Date.now()}`;
    return NextResponse.json({ url });
  } catch (e) {
    console.error("photo upload:", e);
    return NextResponse.json(
      { error: "アップロードに失敗しました（設定を確認してください）。" },
      { status: 500 }
    );
  }
}
