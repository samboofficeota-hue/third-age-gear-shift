/**
 * コンテンツセット機能の公開窓口（純粋データ・クライアント安全）。
 * サーバー専用の解決ヘルパーは lib/content/resolve.ts を使う。
 */

import type { ContentSet } from "@/lib/content/types";
import type { PhaseId } from "@/lib/phases";

export type { ContentSet } from "@/lib/content/types";
export {
  CONTENT_SETS,
  DEFAULT_CONTENT_SET_ID,
  getContentSet,
  listContentSets,
} from "@/lib/content/sets";
export { SURVEY_REGISTRY, isCanonicalKey } from "@/lib/content/registry";
export { validateContentSet, assertAllContentSetsValid } from "@/lib/content/validate";

/** フェーズが研修セットに含まれる（受講者フローに出す）か */
export function isPhaseEnabled(set: ContentSet, phaseId: PhaseId): boolean {
  return set.phases.includes(phaseId);
}

/**
 * ワークシート内サブセクションが有効か。
 * sections に未指定のキーは既定で有効（true）とみなす。
 * → default セットは sections={} なので、既存のシートは全て表示される。
 */
export function isSectionEnabled(set: ContentSet, key: string): boolean {
  return set.sections[key] !== false;
}
