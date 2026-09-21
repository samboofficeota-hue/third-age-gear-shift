/**
 * すべての研修セット（コホート）が共通のデータ契約を守っているか検査する。
 * コホートごとに見た目は変わっても、Supabase に入るキー・意味は共通に固定する
 * ── その不変条件を CI / 手元で確認するためのスクリプト。
 *
 *   npm run content:check
 *
 * 問題があれば内容を表示して非ゼロ終了する。
 */

import { CONTENT_SETS } from "@/lib/content/sets";
import { validateContentSet } from "@/lib/content/validate";

let failed = false;
for (const set of Object.values(CONTENT_SETS)) {
  const issues = validateContentSet(set);
  if (issues.length === 0) {
    console.log(`✓ ${set.id}（${set.label}）`);
  } else {
    failed = true;
    console.error(`✗ ${set.id}（${set.label}）`);
    for (const m of issues) console.error(`    - ${m}`);
  }
}

if (failed) {
  console.error("\nデータ契約違反があります。上記を修正してください。");
  process.exit(1);
}
console.log("\nすべての研修セットがデータ契約を満たしています。");
