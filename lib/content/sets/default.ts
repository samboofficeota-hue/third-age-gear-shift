/**
 * 標準の研修セット（default）。
 * 現行の講座構成をそのまま宣言する ＝ このセットを使う限り従来と挙動が変わらない。
 * 新しい研修セットは、この default を土台に差し替えを宣言していく。
 */

import type { ContentSet } from "@/lib/content/types";
import type { PhaseId } from "@/lib/phases";
import {
  PRE_SCALE_SECTIONS,
  POST_SCALE_SECTIONS,
  SECTION_D,
  SECTION_E,
} from "@/lib/surveyContent";

// 全フェーズ（PHASE_IDS と一致）。lib/phases.ts は prisma を runtime import するため、
// クライアントにも読まれるこのモジュールでは値としては import せず、リテラルで持つ。
const ALL_PHASES: PhaseId[] = ["pre", "day1", "homework", "day2", "post"];

export const DEFAULT_CONTENT_SET: ContentSet = {
  id: "default",
  label: "標準（じぶん経営 戦略講座）",
  description: "現行の標準構成。事前アンケート §A〜D ＋ じぶん紹介、Day1・宿題・Day2、事後アンケート §A〜E。",
  phases: ALL_PHASES,
  survey: {
    pre: {
      nendai: true,
      scaleSections: PRE_SCALE_SECTIONS,
      choice: SECTION_D,
      reasonBranches: true,
    },
    post: {
      scaleSections: POST_SCALE_SECTIONS,
      choice: SECTION_D,
      reasonBranches: true,
      evaluation: SECTION_E,
      freeText: true,
    },
  },
  sections: {},
};
