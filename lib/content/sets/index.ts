/**
 * 研修セットのレジストリ。
 * WorkshopSession.contentSetId → ContentSet の対応表。
 *
 * 新しい研修セットを足すときは:
 *   1) このディレクトリに設定を1つ定義（default を土台に差し替えを宣言）
 *   2) 下の CONTENT_SETS に登録
 *   3) 管理画面のプルダウンには自動で並ぶ（listContentSets を参照）
 *
 * このモジュールは「純粋なデータ」だけを扱い、prisma など server 専用の
 * import を持たない。サーバー / クライアント双方から読める。
 */

import type { ContentSet } from "@/lib/content/types";
import { DEFAULT_CONTENT_SET } from "@/lib/content/sets/default";
import { KOJIN_WORKSHOP_SET } from "@/lib/content/sets/kojin-workshop";
import { JIBUN_KEIEI_SHUCHU_SET } from "@/lib/content/sets/jibun-keiei-shuchu";
import { assertAllContentSetsValid } from "@/lib/content/validate";

/** 既定の研修セット id */
export const DEFAULT_CONTENT_SET_ID = "default";

/** 登録済みの研修セット一覧（id → ContentSet） */
export const CONTENT_SETS: Record<string, ContentSet> = {
  [DEFAULT_CONTENT_SET.id]: DEFAULT_CONTENT_SET,
  [JIBUN_KEIEI_SHUCHU_SET.id]: JIBUN_KEIEI_SHUCHU_SET,
  [KOJIN_WORKSHOP_SET.id]: KOJIN_WORKSHOP_SET,
};

// データ契約（共通の設問キー・意味）の検査。
// コホートを増やすときの設定ミスを早期に検出する。サーバーの非本番でのみ実行し、
// クライアントバンドルや本番の実行時コストには影響させない（本番は CI / build で担保）。
if (typeof window === "undefined" && process.env.NODE_ENV !== "production") {
  assertAllContentSetsValid(CONTENT_SETS);
}

/**
 * id から研修セットを取得する。未知 / 未指定の id は default にフォールバック。
 * （旧セッションや、削除されたセットを指す行があっても壊れないように）
 */
export function getContentSet(id: string | null | undefined): ContentSet {
  if (id && CONTENT_SETS[id]) return CONTENT_SETS[id];
  return DEFAULT_CONTENT_SET;
}

/** 管理画面のプルダウン用（id・ラベル・説明の一覧） */
export function listContentSets(): {
  id: string;
  label: string;
  description: string;
}[] {
  return Object.values(CONTENT_SETS).map((s) => ({
    id: s.id,
    label: s.label,
    description: s.description,
  }));
}
