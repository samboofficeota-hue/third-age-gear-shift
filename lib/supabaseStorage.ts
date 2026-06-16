import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase Storage 管理クライアント（サーバー専用・service role）。
 * 画像アップロードはこのクライアント経由でサーバー側のみ実行する。
 * env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

export const PHOTO_BUCKET = "worksheet-photos";

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
