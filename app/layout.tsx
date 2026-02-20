import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "サードエイジへのギア・シフト",
  description: "ミドルシニア向けキャリア研修",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
