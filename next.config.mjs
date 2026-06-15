/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
