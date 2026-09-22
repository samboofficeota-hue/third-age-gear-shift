/**
 * アンケート設問の「正典レジストリ」。
 *
 * コホート（研修セット）ごとに “見た目” は変わっても、Supabase に保存するデータの
 * キーと意味は全コホートで共通に固定する ── これが横比較・時系列比較の前提。
 * その唯一の真実（single source of truth）がこのレジストリ。
 *
 * 中身は lib/surveyContent.ts の設問定数から機械的に構築する（二重管理しない）。
 * ここに存在しないキーを保存してはいけない。既存キーの kind / 文言を変えてもいけない
 * （＝過去データと意味が食い違う）。設問を増やすときは surveyContent.ts に足してから
 * 参照する。検査は lib/content/validate.ts が行う。
 */

import {
  SECTION_A,
  SECTION_C,
  SECTION_G,
  NENDAI,
  SECTION_D,
  REASON_TENSHOKU,
  REASON_KOYOU,
  CHALLENGE_CHUSHO,
  SUPPORT,
  SECTION_E,
  EVAL_STRATEGY_SATISFACTION,
  POST_FREETEXT,
  FOLLOWUP_SCALE,
  FOLLOWUP_SOCIETY,
  FOLLOWUP_COMPANY,
  type ScaleSection,
  type ChoiceQuestion,
} from "@/lib/surveyContent";

/** 保存される回答の型（比較のときに前提にする） */
export type QuestionKind = "likert" | "nps" | "choice" | "multi" | "text";

export interface RegistryEntry {
  key: string;
  kind: QuestionKind;
  /** 設問文（同一キーは全コホートで同一文言であること） */
  text: string;
}

function scaleEntries(section: ScaleSection): RegistryEntry[] {
  return section.questions.map((q) => ({ key: q.key, kind: "likert" as const, text: q.text }));
}

function choiceEntry(q: ChoiceQuestion, kind: "choice" | "multi"): RegistryEntry {
  return { key: q.key, kind, text: q.text };
}

/** 正典に含める全エントリ（重複キーは構築時に弾く） */
const ALL_ENTRIES: RegistryEntry[] = [
  // §A / §C 5段階（事前・事後 共通）
  ...scaleEntries(SECTION_A),
  ...scaleEntries(SECTION_C),
  // §G これからのつながりと挑戦（コホート別・事前事後共通）
  ...scaleEntries(SECTION_G),
  // 属性・§D・分岐
  choiceEntry(NENDAI, "choice"),
  choiceEntry(SECTION_D, "choice"),
  choiceEntry(REASON_TENSHOKU, "choice"),
  choiceEntry(REASON_KOYOU, "choice"),
  choiceEntry(CHALLENGE_CHUSHO, "choice"),
  choiceEntry(SUPPORT, "multi"),
  // §E 研修評価（事後）
  ...SECTION_E.questions.map((q) => ({
    key: q.key,
    kind: q.kind === "nps" ? ("nps" as const) : ("likert" as const),
    text: q.text,
  })),
  { key: EVAL_STRATEGY_SATISFACTION.key, kind: "likert", text: EVAL_STRATEGY_SATISFACTION.text },
  { key: POST_FREETEXT.key, kind: "text", text: POST_FREETEXT.label },
  // §F フォロー（3ヶ月後・別送）
  ...scaleEntries(FOLLOWUP_SCALE),
  { key: FOLLOWUP_SOCIETY.key, kind: "text", text: FOLLOWUP_SOCIETY.label },
  { key: FOLLOWUP_COMPANY.key, kind: "text", text: FOLLOWUP_COMPANY.label },
];

/** key → 正典エントリ。同一キーの二重定義があれば起動時に気づけるよう例外にする。 */
export const SURVEY_REGISTRY: Record<string, RegistryEntry> = (() => {
  const map: Record<string, RegistryEntry> = {};
  for (const e of ALL_ENTRIES) {
    if (map[e.key]) {
      throw new Error(
        `[survey-registry] 設問キー "${e.key}" が正典内で重複しています。surveyContent.ts を確認してください。`
      );
    }
    map[e.key] = e;
  }
  return map;
})();

/** 正典に載っているキーか */
export function isCanonicalKey(key: string): boolean {
  return key in SURVEY_REGISTRY;
}

/**
 * 比較の中核キー（コア）。
 * §A・§C は事前・事後で同一の5段階設問で、回をまたいだ横比較・事前→事後の変化量の
 * 主指標になる。コホートがこれらを省くと「そのコホートだけ主指標が取れない」ため、
 * バリデータは（ブロックはしないが）警告する。
 */
export const CORE_COMPARABLE_KEYS: string[] = [
  ...SECTION_A.questions.map((q) => q.key),
  ...SECTION_C.questions.map((q) => q.key),
];

/**
 * 推奨キー。§D（今後の働き方の方向性）は産業雇用安定センター調査と突き合わせる
 * ベンチマーク指標。必須ではないが、省くと外部比較ができなくなるため警告する。
 */
export const RECOMMENDED_KEYS: string[] = [SECTION_D.key];
