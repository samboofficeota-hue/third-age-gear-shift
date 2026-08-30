import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase Storage 管理クライアント（サーバー専用・service role）。
 * 画像アップロードはこのクライアント経由でサーバー側のみ実行する。
 * env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

export const PHOTO_BUCKET = "worksheet-photos";

/** アップロードを許す画像の MIME → 保存時の拡張子 */
const IMAGE_EXT = new Map<string, string>([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
]);

/**
 * アップロードされた画像の MIME を検証し、保存用の拡張子を返す。許可外は null。
 *
 * ⚠️ ここを素のオブジェクトリテラル（`EXT[file.type]`）で書くと、添字アクセスが
 * Object.prototype まで辿ってしまう。`file.type` はクライアントが送る Content-Type を
 * そのまま持つため、"constructor" や "toString" を指定するだけで truthy な値が返り、
 * **415 のチェックを素通りできる**（2026-08-27 のセキュリティレビューで検出）。
 * プロトタイプを持たない Map で引くこと。
 */
export function imageExtFor(mime: string): string | null {
  return IMAGE_EXT.get(mime) ?? null;
}

let cached: SupabaseClient | null = null;

export function getStorageAdmin(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が未設定です。env を確認してください。"
    );
  }
  if (!cached) {
    cached = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}
