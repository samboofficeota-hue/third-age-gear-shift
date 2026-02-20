import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as jose from "jose";

const JWT_COOKIE = process.env.JWT_COOKIE_NAME ?? "third_age_session";
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-production";

async function getPayload(request: NextRequest): Promise<{
  sub: string;
  role: string;
} | null> {
  const token = request.cookies.get(JWT_COOKIE)?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(
      (JWT_SECRET as string).slice(0, 64)
    );
    const { payload } = await jose.jwtVerify(token, secret);
    const sub = payload.sub as string;
    const role = payload.role as string;
    if (!sub || !role) return null;
    return { sub, role };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 認証不要
  if (
    path.startsWith("/api/auth") ||
    path === "/login" ||
    path === "/" ||
    path.startsWith("/_next") ||
    path.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  const payload = await getPayload(request);

  // /admin は admin または facilitator のみ
  if (path.startsWith("/admin")) {
    if (!payload) {
      const login = new URL("/login", request.url);
      login.searchParams.set("from", path);
      return NextResponse.redirect(login);
    }
    if (payload.role !== "admin" && payload.role !== "facilitator") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // /workshop はログイン必須
  if (path.startsWith("/workshop")) {
    if (!payload) {
      const login = new URL("/login", request.url);
      login.searchParams.set("from", path);
      return NextResponse.redirect(login);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/workshop/:path*", "/admin/:path*", "/login"],
};
