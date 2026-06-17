import type { Metadata } from "next";
import { TrainingHeader } from "./TrainingHeader";

export const metadata: Metadata = {
  title: "研修本番 | サードエイジ じぶん戦略講座",
};

/**
 * Program B（研修本番）の全面ライトテーマ。
 * 不透明な白地で body のダーク背景を覆う。配下のワークシートも白基調になる。
 */
export default function TrainingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-ws-fill text-ws-ink">
      <TrainingHeader />
      <main>{children}</main>
    </div>
  );
}
