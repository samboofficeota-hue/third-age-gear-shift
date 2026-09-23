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
 * コンテンツは標準（default）を土台にしつつ、この回の路線
 * （「コミュニティのチカラを活かして ライフ＆キャリアを面白くしていく」）に合わせて
 * §D（今後の働き方の方向性＝定年前後のセカンドキャリア・外部ベンチマーク）を外す。
 * 比較の中核 §A・§C は事前・事後で残し、横比較・事前→事後比較の主指標は維持する。
 */

import type { ContentSet, EvaluationSection } from "@/lib/content/types";
import { DEFAULT_CONTENT_SET } from "@/lib/content/sets/default";
import {
  PRE_SCALE_SECTIONS,
  POST_SCALE_SECTIONS,
  SECTION_G,
  SECTION_E,
  EVAL_STRATEGY_SATISFACTION,
} from "@/lib/surveyContent";

// §E 研修評価：e3「シフト戦略…」を新路線の言い回し（e6）に差し替えた、この回用の評価セット。
const EVALUATION_JIBUN: EvaluationSection = {
  ...SECTION_E,
  questions: SECTION_E.questions.map((q) =>
    q.key === "e3" ? EVAL_STRATEGY_SATISFACTION : q
  ),
};

export const JIBUN_KEIEI_SHUCHU_SET: ContentSet = {
  ...DEFAULT_CONTENT_SET,
  id: "jibun-keiei-shuchu",
  label: "じぶん経営戦略 集中講座",
  description:
    "半日×2日＋合間の宿題の集合型研修。§A・§C（比較の中核）は事前・事後で実施し、§D（定年前後の方向性）は外した構成。",
  // コホート専用ランディング（/c/jibunkeiei-2610）で出す表示。
  brand: {
    name: "じぶん経営戦略 集中講座",
    tagline: "コミュニティのチカラを活かして ライフ＆キャリアを面白くしていく",
    lead: "じぶんを会社に見立てて、じぶんを社長と見立てて、じぶんの経営戦略をつくっていく講座です。",
  },
  // 半日×2日＋宿題 = 標準の5フェーズ
  phases: ["pre", "day1", "homework", "day2", "post"],
  survey: {
    // §D（今後の働き方の方向性）と分岐設問（図2〜5）を外す。
    // §A・§C の5段階は事前・事後で残し、この回の路線に合わせて §G を足す。
    pre: {
      ...DEFAULT_CONTENT_SET.survey.pre,
      scaleSections: [...PRE_SCALE_SECTIONS, SECTION_G],
      choice: null,
      reasonBranches: false,
    },
    post: {
      ...DEFAULT_CONTENT_SET.survey.post,
      scaleSections: [...POST_SCALE_SECTIONS, SECTION_G],
      choice: null,
      reasonBranches: false,
      // §E は e3 を e6（新路線の言い回し）に差し替えたこの回用セットを使う
      evaluation: EVALUATION_JIBUN,
      // 自由記述は default のまま残す
    },
  },
};
