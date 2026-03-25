import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ログイン | サードエイジ じぶん戦略講座",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
