import { createBrowserClient } from "@supabase/ssr";

/**
 * ブラウザ側の Supabase クライアント（マジックリンク送信・PKCEコード交換用）。
 * コード交換は /auth/callback で明示的に行うため、自動検出は切る
 * （自動検出に任せると二重交換で「code already used」になる）。
 */
export function getSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: "pkce",
        detectSessionInUrl: false,
      },
    }
  );
}
