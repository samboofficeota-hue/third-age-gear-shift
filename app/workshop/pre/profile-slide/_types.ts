/**
 * じぶん紹介（事前課題）で扱う型と、入力欄の長さを揃えるヘルパー。
 * シート間で共有するため別ファイルに切り出し。
 */
import type { Area } from "react-easy-crop";

export type HistRow = { year: string; event: string };

export type Work = {
  company?: string;
  dept?: string;
  title?: string;
  q1?: string; // 会社は何のため・誰に・何を
  q2?: string; // あなたの役割・価値
  q3?: string; // どんな仕事・役割・責任
};

export type Slide = {
  name?: string;
  nickname?: string;
  points?: string[];
  photo?: string; // 表示用のトリミング済み画像URL
  photoOriginal?: string; // トリミング前の元画像URL
  photoArea?: Area; // 直近のクロップ範囲（再調整時に枠取りを復元する）
  history?: HistRow[];
  work?: Work;
};

/** 「3 つのポイント」は常に 5 枠で表示するため、足りない分を空文字で埋める */
export function pad(points?: string[]): string[] {
  const p = [...(points ?? [])];
  while (p.length < 5) p.push("");
  return p.slice(0, 5);
}

/** 生い立ち年表は最小 n 行で表示するため、足りない分を空オブジェクトで埋める */
export function padHist(history: HistRow[] | undefined, n: number): HistRow[] {
  const h = [...(history ?? [])];
  while (h.length < n) h.push({ year: "", event: "" });
  return h;
}
