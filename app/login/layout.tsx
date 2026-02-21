import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ログイン | サードエイジへのギア・シフト",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
