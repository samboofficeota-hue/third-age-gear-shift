/**
 * 受講生ビュー（運営が見る）で開けるシートの一覧。
 * 受講生のフェーズ（pre / day1 / homework / day2）にぶら下げて、
 * 受講生のポータルと同じ並び順で見せる。
 */

export type SheetGroup = "pre" | "day1" | "homework" | "day2";

export type SheetId =
  | "intro"
  | "day1"
  | "scenario"
  | "excursion"
  | "assets"
  | "day2";

export const SHEETS: {
  id: SheetId;
  group: SheetGroup;
  label: string;
  description: string;
}[] = [
  {
    id: "intro",
    group: "pre",
    label: "じぶん紹介・ライフラインチャート",
    description: "Day1の冒頭で発表するシート",
  },
  {
    id: "day1",
    group: "day1",
    label: "じぶん分解・じぶん分析",
    description: "分人シェア／マイ・ポートフォリオ／好きと得意ほか",
  },
  {
    id: "scenario",
    group: "homework",
    label: "みらいシナリオ",
    description: "会社のみらい・社会のみらい",
  },
  {
    id: "excursion",
    group: "homework",
    label: "プチ越境体験レポート",
    description: "企画した体験の実施レポート",
  },
  {
    id: "assets",
    group: "homework",
    label: "じぶん資産表",
    description: "生産性・活力・変革の3枚",
  },
  {
    id: "day2",
    group: "day2",
    label: "Day2 ワーク",
    description: "ポートフォリオ／自己診断／バックキャスト／行動計画ほか",
  },
];

export function isSheetId(v: string): v is SheetId {
  return SHEETS.some((s) => s.id === v);
}
