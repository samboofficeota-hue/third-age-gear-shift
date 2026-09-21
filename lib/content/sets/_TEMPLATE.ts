/**
 * 【新しいコホートの雛形】案件受注ごとに、このファイルをコピーして作る。
 *
 *   手順:
 *     1. このファイルを lib/content/sets/<案件id>.ts にコピー
 *     2. id / label / description / phases / survey を案件に合わせて書き換え
 *     3. lib/content/sets/index.ts の CONTENT_SETS に登録
 *     4. `npm run content:check` で ✗（データ契約違反）が無いことを確認
 *        （✗ が1つでもあればビルドも通らない。⚠ は指摘なので、意図的ならそのままでよい）
 *     5. 管理画面 → 研修の作成/編集で、その研修にこのコホートを割り当てる
 *
 *   守るべきルール（比較可能性の担保・詳細は docs/CONTENT_SETS.md）:
 *     - 設問は surveyContent.ts の正典から参照する。勝手に新しいキーを作らない。
 *     - 同じキー（a1 / d1 / e2 …）の文言・種類はコホート間で変えない。
 *     - 事後のスケール設問は必ず事前にも出す。
 *     - できれば §A・§C（中核）と §D（外部ベンチマーク）は残す（省くと ⚠ で指摘される）。
 *
 * ※ このファイル自体は雛形なので CONTENT_SETS には登録しない（先頭の _ は未登録の目印）。
 */

import type { ContentSet } from "@/lib/content/types";
import { DEFAULT_CONTENT_SET } from "@/lib/content/sets/default";

export const TEMPLATE_SET: ContentSet = {
  ...DEFAULT_CONTENT_SET,
  id: "TEMPLATE", // ← 案件id に変更（英数字・ハイフン）
  label: "（案件名）", // ← 管理画面のプルダウン表示
  description: "（この回の構成の説明）",

  // 実施するフェーズ。省くフェーズを外す。
  phases: ["pre", "day1", "homework", "day2", "post"],

  survey: {
    // 事前アンケート
    pre: {
      ...DEFAULT_CONTENT_SET.survey.pre,
      // nendai: true,          // 年代属性を出すか
      // scaleSections: [...],  // §A〜C の取捨（既定は §A・§C）
      // choice: SECTION_D,     // §D。省くなら null
      // reasonBranches: true,  // §D の分岐設問（図2〜5）
    },
    // 事後アンケート
    post: {
      ...DEFAULT_CONTENT_SET.survey.post,
      // choice: SECTION_D,     // §D。省くなら null
      // reasonBranches: true,
      // evaluation: SECTION_E, // §E 研修評価。省くなら null
      // freeText: true,        // 自由記述
    },
  },

  // ワークシート内サブセクションのオンオフ（対応シートのみ）。例:
  // sections: { "day2.backcast": false },
};
