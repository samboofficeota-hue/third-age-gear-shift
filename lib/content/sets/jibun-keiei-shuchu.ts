/**
 * じぶん経営戦略 集中講座（集合型研修）。
 *
 * サードエイジプロジェクト（third-age-shift）の「じぶん経営 戦略講座」に対応する
 * 最初のコホート。半日×2日＋合間の宿題という構成で、標準の5フェーズ
 * （pre → day1 → homework → day2 → post）にそのまま対応する。
 *
 * 概要（third-age-shift / src/features/landing/data/programs.ts より）:
 *   - 形式: 半日 × 2日間（講義＋演習）＋ 合間に体験型の宿題（約3週間）
 *   - DAY 1: じぶん分解・じぶん分析 ／ DAY 2: ビジョン策定・WCM3.0づくり
 *   - 事前課題あり・事前/事後アンケートを実施
 *   - 13のワークシートをデータ化し、比較検討可能にする
 *
 * コンテンツは標準（default）と同一。アンケートも §A〜D（事前）/ §A〜E（事後）を
 * フルで実施するため、横比較・事前→事後比較の主指標をすべて備える。
 * この回だけの差し替えが出てきたら、ここで default から上書きする。
 */

import type { ContentSet } from "@/lib/content/types";
import { DEFAULT_CONTENT_SET } from "@/lib/content/sets/default";

export const JIBUN_KEIEI_SHUCHU_SET: ContentSet = {
  ...DEFAULT_CONTENT_SET,
  id: "jibun-keiei-shuchu",
  label: "じぶん経営戦略 集中講座",
  description:
    "半日×2日＋合間の宿題の集合型研修。標準フル構成（事前アンケート §A〜D ＋ じぶん紹介、Day1・宿題・Day2、事後アンケート §A〜E）。",
  // 半日×2日＋宿題 = 標準の5フェーズ
  phases: ["pre", "day1", "homework", "day2", "post"],
  // survey / sections は default を継承（フルのアンケートで比較可能性を最大化）
};
