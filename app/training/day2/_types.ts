/**
 * Day2 で扱う型定義と空値の初期定数。
 * シート間で共有するため別ファイルに切り出している。
 */
import type { PortfolioCircle } from "@/components/worksheet/CommunityPortfolio";

export type Portfolio = {
  future?: PortfolioCircle[];
  year?: string;
  /** シフトポイントは複数ボックス（3〜5個）。旧データは string 単体の場合がある */
  shift?: string[] | string;
};

/** No → 合計スコア（1〜10）の自己診断スコア */
export type Diagnosis = Record<number, number>;

export type ActionTarget = {
  why: string;
  with: string;
  what: string;
  sowhat: string;
};

/** 対象は1つに集約（旧A/B2枠から変更）。1枚の入力シートで記入する */
export type ActionPlan = ActionTarget & {
  target: string;
};

export const EMPTY_TARGET: ActionTarget = {
  why: "",
  with: "",
  what: "",
  sowhat: "",
};

export const EMPTY_ACTION: ActionPlan = {
  target: "",
  ...EMPTY_TARGET,
};

export type WCM = { will: string; can: string; must: string };
export const EMPTY_WCM: WCM = { will: "", can: "", must: "" };

export type WcmMeta = {
  curYear: string;
  curAge: string;
  futYear: string;
  futAge: string;
};
export const EMPTY_WCM_META: WcmMeta = {
  curYear: "2026",
  curAge: "",
  futYear: "",
  futAge: "",
};

export type Backcast = {
  issue: string;
  goal: string;
  firstStep: string;
};
export const EMPTY_BACKCAST: Backcast = {
  issue: "",
  goal: "",
  firstStep: "",
};

export type Summary = {
  must: string;
  will: string;
  issue: string;
  flag: string;
  start: string;
};
export const EMPTY_SUMMARY: Summary = {
  must: "",
  will: "",
  issue: "",
  flag: "",
  start: "",
};
