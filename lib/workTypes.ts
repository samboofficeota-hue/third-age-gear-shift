export type WorkType = "A" | "B" | "C" | "D" | "E";

export const WORK_TYPES: {
  id: WorkType;
  label: string;        // 日本語フルラベル
  badge: string;        // 短いバッジラベル (英語)
  sub: string;          // サブテキスト
  color: string;        // チャート用HEXカラー
  selectedClass: string; // 選択時のTailwindクラス
  dotClass: string;     // ドット用Tailwindクラス
}[] = [
  {
    id: "A",
    label: "お金をもらうワーク",
    badge: "Paid",
    sub: "Paid Work",
    color: "#c026d3",
    selectedClass: "bg-[#c026d3] border-[#c026d3] text-white",
    dotClass: "bg-[#c026d3]",
  },
  {
    id: "B",
    label: "家族のためのワーク",
    badge: "Home",
    sub: "Home Work",
    color: "#3B82F6",
    selectedClass: "bg-blue-500 border-blue-500 text-white",
    dotClass: "bg-blue-500",
  },
  {
    id: "C",
    label: "社会に貢献するワーク",
    badge: "Gift",
    sub: "Gift Work",
    color: "#00b860",
    selectedClass: "bg-[#00b860] border-[#00b860] text-white",
    dotClass: "bg-[#00b860]",
  },
  {
    id: "D",
    label: "自分を高めるワーク",
    badge: "Study",
    sub: "Study Work",
    color: "#F97316",
    selectedClass: "bg-orange-500 border-orange-500 text-white",
    dotClass: "bg-orange-500",
  },
  {
    id: "E",
    label: "その他",
    badge: "Other",
    sub: "移動・SNS・娯楽・無駄時間など",
    color: "#A8A29E",
    selectedClass: "bg-stone-400 border-stone-400 text-white",
    dotClass: "bg-stone-400",
  },
];

/** チャート・スタイル用のID→HEXカラーマップ */
export const WORK_COLORS: Record<WorkType, string> = Object.fromEntries(
  WORK_TYPES.map((w) => [w.id, w.color])
) as Record<WorkType, string>;
