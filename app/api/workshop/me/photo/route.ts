import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getStorageAdmin, PHOTO_BUCKET } from "@/lib/supabaseStorage";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

type UploadResult = { url: string } | { error: string; status: number };

async function uploadImage(
  userId: string,
  baseName: string,
  file: File
): Promise<UploadResult> {
  if (file.size > MAX_BYTES) {
    return { error: "画像は5MB以内にしてください。", status: 413 };
  }
  const ext = EXT[file.type];
  if (!ext) {
    return { error: "PNG / JPEG / WebP の画像をご利用ください。", status: 415 };
  }
  const admin = getStorageAdmin();
  const path = `${userId}/${baseName}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage
    .from(PHOTO_BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: true });
  if (error) {
    console.error("photo upload:", error.message);
    return { error: "アップロードに失敗しました。", status: 500 };
  }
  const { data } = admin.storage.from(PHOTO_BUCKET).getPublicUrl(path);
  // upsert で同一パスのため、CDNキャッシュをバストする
  return { url: `${data.publicUrl}?v=${Date.now()}` };
}

/**
 * プロフィール写真のアップロード（認証必須）。
 * - file: 表示用のトリミング済み画像（必須）→ profile.<ext>
 * - original: トリミング前の元画像（任意）→ profile-original.<ext>（後から再調整するため保持）
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

  try {
    const cropped = await uploadImage(session.sub, "profile", file);
    if ("error" in cropped) {
      return NextResponse.json({ error: cropped.error }, { status: cropped.status });
    }

    // 元画像（任意）。新規アップロード時のみ送られる。
    const original = form?.get("original");
    let originalUrl: string | undefined;
    if (original instanceof File) {
      const orig = await uploadImage(session.sub, "profile-original", original);
      if ("url" in orig) originalUrl = orig.url;
      // 元画像の失敗は致命ではないので無視（表示用は成功している）
    }

    return NextResponse.json({ url: cropped.url, originalUrl });
  } catch (e) {
    console.error("photo upload:", e);
    return NextResponse.json(
      { error: "アップロードに失敗しました（設定を確認してください）。" },
      { status: 500 }
    );
  }
}
