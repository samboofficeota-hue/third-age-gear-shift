/**
 * すべての研修セット（コホート）が共通のデータ契約を守っているか検査する。
 * コホートは案件受注ごとに1つずつ増える。増やすたびに、このチェックで
 * 「データセットのガイドラインから外れていないか」を確認する。
 *
 *   npm run content:check
 *
 * - errors（データ契約違反・比較不能）… 1つでもあれば非ゼロ終了（ビルドもブロック）
 * - warnings（ガイドラインからの逸脱）… 指摘のみ。終了コードには影響しない
 */

import { CONTENT_SETS } from "@/lib/content/sets";
import { validateContentSet } from "@/lib/content/validate";

let errorCount = 0;
let warnCount = 0;

for (const set of Object.values(CONTENT_SETS)) {
  const { errors, warnings } = validateContentSet(set);
  if (errors.length === 0 && warnings.length === 0) {
    console.log(`✓ ${set.id}（${set.label}）`);
    continue;
  }
  const mark = errors.length > 0 ? "✗" : "⚠";
  console.log(`${mark} ${set.id}（${set.label}）`);
  for (const m of errors) console.error(`    ✗ ${m}`);
  for (const m of warnings) console.warn(`    ⚠ ${m}`);
  errorCount += errors.length;
  warnCount += warnings.length;
}

console.log("");
if (errorCount > 0) {
  console.error(
    `データ契約違反 ${errorCount} 件。比較可能性が壊れます。上記の ✗ を修正してください。` +
      (warnCount ? `（ほかに指摘 ${warnCount} 件）` : "")
  );
  process.exit(1);
}
if (warnCount > 0) {
  console.log(
    `データ契約は満たしています（違反 0 件）。ただしガイドラインの指摘 ${warnCount} 件 ⚠ を確認してください。`
  );
} else {
  console.log("すべての研修セットがデータ契約・ガイドラインを満たしています。");
}
