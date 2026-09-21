/**
 * 【サンプル / ひな型】個人向けワークショップ回の研修セット。
 *
 * 「個人向けの会は、宿題フェーズを省き、事後アンケートを簡素化したい」という
 * 想定でつくった見本。実際の回に合わせて自由に書き換えてよい（このファイルを
 * コピーして別 id のセットを増やしてもよい）。
 *
 * default からの差し替えポイント:
 *   - phases: "homework"（プチ越境体験・宿題）を外す
 *   - 事前アンケート: §D の分岐設問（図2〜5）を省く
 *   - 事後アンケート: §D を省き、§E 研修評価と自由記述だけにする
 */

import type { ContentSet } from "@/lib/content/types";
import { DEFAULT_CONTENT_SET } from "@/lib/content/sets/default";

export const KOJIN_WORKSHOP_SET: ContentSet = {
  ...DEFAULT_CONTENT_SET,
  id: "kojin-workshop",
  label: "個人向けワークショップ（サンプル）",
  description: "宿題フェーズを省いた短縮構成。事後アンケートは研修評価中心の簡素版。",
  // 宿題を外した4フェーズ構成
  phases: ["pre", "day1", "day2", "post"],
  survey: {
    pre: {
      ...DEFAULT_CONTENT_SET.survey.pre,
      // §D は残しつつ、分岐の深掘り設問は省く
      reasonBranches: false,
    },
    post: {
      ...DEFAULT_CONTENT_SET.survey.post,
      // §A〜C の変化量は測るが、§D と分岐は省く
      choice: null,
      reasonBranches: false,
      // §E 研修評価・自由記述は残す
    },
  },
};
