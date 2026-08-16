import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Supabase Auth（マジックリンク）のセッションを毎リクエスト更新しつつ、
 * ルートごとのアクセス制御を行う。role は DB を引かず auth.users の
 * app_metadata から読む（Edge runtime で Prisma を呼ばないため）。
 */
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 認証不要
  if (
    path.startsWith("/api/auth") ||
    path === "/login" ||
    path === "/register" ||
    path === "/auth/callback" ||
    path === "/" ||
    path.startsWith("/_next") ||
    path.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() はトークンをSupabaseに検証させる（getSession()はローカル検証のみで偽装可能）
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = (user?.app_metadata?.role as string | undefined) ?? null;

  // /admin は admin または facilitator のみ
  if (path.startsWith("/admin")) {
    if (!user) {
      const login = new URL("/login", request.url);
      login.searchParams.set("from", path);
      return NextResponse.redirect(login);
    }
    if (role !== "admin" && role !== "facilitator") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return response;
  }

  // /workshop はログイン必須
  if (path.startsWith("/workshop")) {
    if (!user) {
      const login = new URL("/login", request.url);
      login.searchParams.set("from", path);
      return NextResponse.redirect(login);
    }
    return response;
  }

  return response;
}

export const config = {
  matcher: ["/workshop/:path*", "/admin/:path*", "/login"],
};
