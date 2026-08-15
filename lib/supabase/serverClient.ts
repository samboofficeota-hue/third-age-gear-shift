import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * サーバー側（Server Component / Route Handler）の Supabase クライアント。
 * Next.js の Cookie 経由でセッションを読み書きする。
 */
export async function getSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component から呼ばれた場合は書き込めない（middlewareが更新するため無視してよい）
          }
        },
      },
    }
  );
}
