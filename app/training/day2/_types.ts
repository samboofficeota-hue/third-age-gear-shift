/**
 * Day2 で扱う型定義と空値の初期定数。
 * シート間で共有するため別ファイルに切り出している。
 */
import type { PortfolioCircle } from "@/components/worksheet/CommunityPortfolio";

export type Portfolio = {
  future?: PortfolioCircle[];
  year?: string;
  shift?: string;
};

/** No → 合計スコア（1〜10）の自己診断スコア */
export type Diagnosis = Record<number, number>;

export type ActionTarget = {
  why: string;
  with: string;
  what: string;
  sowhat: string;
};

export type ActionPlan = {
  targetA: string;
  targetB: string;
  A: ActionTarget;
  B: ActionTarget;
};

export const EMPTY_TARGET: ActionTarget = {
  why: "",
  with: "",
  what: "",
  sowhat: "",
};

export const EMPTY_ACTION: ActionPlan = {
  targetA: "",
  targetB: "",
  A: EMPTY_TARGET,
  B: EMPTY_TARGET,
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
