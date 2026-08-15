import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase 管理クライアント（サーバー専用・service role）。
 * auth.users の app_metadata（role・内部userId同期）の書き込みに使う。
 * env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
let cached: SupabaseClient | null = null;

export function getSupabaseAdminClient(): SupabaseClient {
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
