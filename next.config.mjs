const isDev = process.env.NODE_ENV !== "production";

/**
 * ブラウザ側の Supabase クライアントが直接 fetch する先。
 * マジックリンクの signInWithOtp / verifyOtp、auth/callback の exchangeCodeForSession は
 * すべてブラウザから Supabase のドメインへ出ていくので、connect-src に含めないと
 * CSP がブロックしてログインが成立しない（リクエストが飛ばないので Supabase 側のログにも残らない）。
 *
 * ここで空文字にフォールバックすると「CSPだけ静かに壊れる」状態になり、
 * 原因の分かりにくい障害になるため、本番ビルドでは明示的に失敗させる。
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
if (!supabaseUrl && !isDev) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL is not set at build time. " +
      "CSP の connect-src に Supabase を許可できず、マジックリンクのログインが動かなくなります。" +
      "Vercel → Settings → Environment Variables を確認してください。"
  );
}

/**
 * セキュリティヘッダー。
 * 外部ホストからの読み込み・外部への送信を既定で遮断し、XSS が入り込んだ場合の
 * 被害（情報の持ち出し・クリックジャッキング）を抑える。
 * 開発時のみ webpack HMR のために eval を許可する。
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  // data:/blob: は写真のトリミング（canvas → blob）で必要
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${supabaseUrl ? ` ${supabaseUrl}` : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return [
      // 旧ブロックURL（block-0〜8）→ 新ダッシュボードへ
      {
        source: "/workshop/block-:n*",
        destination: "/workshop",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
