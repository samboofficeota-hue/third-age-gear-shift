import type { HistRow } from "./_types";

export const WORK_FIELDS: { key: "company" | "dept" | "title"; label: string }[] = [
  { key: "company", label: "会社名" },
  { key: "dept", label: "部署名" },
  { key: "title", label: "肩書き・役割" },
];

export const WORK_QUESTIONS: {
  key: "q1" | "q2" | "q3";
  title: string;
  q: [string, string];
}[] = [
  {
    key: "q1",
    title: "会社の役割",
    q: ["何のために、誰に向けた会社か", "何をしている会社か"],
  },
  {
    key: "q2",
    title: "組織の役割",
    q: ["会社の中での役割は？", "担っている責任は？"],
  },
  {
    key: "q3",
    title: "自分の役割",
    q: ["どんな仕事をしている？", "誰に対する仕事かな？"],
  },
];

export const MIN_HIST_ROWS = 8;
export const MAX_HIST_ROWS = 12;

/** 年表のプレースホルダ（1 行目=生年は任意、それ以降は誘導用） */
export const HIST_PH: HistRow[] = [
  { year: "生年", event: "〇〇県で生まれる" },
  { year: "19xx", event: "〇〇高校に入学" },
  { year: "19xx", event: "〇〇大学を卒業" },
  { year: "20xx", event: "〇〇株式会社に入社" },
  { year: "20xx", event: "〇〇部署へ異動" },
  { year: "20xx", event: "現在に至る" },
];

export const HIST_PH_FALLBACK: HistRow = { year: "20xx", event: "出来事を記入" };
