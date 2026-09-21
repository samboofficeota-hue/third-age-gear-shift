/**
 * コホート（研修セット）が「共通のデータ契約」を守っているか検査する。
 *
 * 見た目（出す設問・フェーズ）はセットごとに変えてよいが、保存するデータのキーと意味は
 * 全コホートで共通に固定する。これを破ると Supabase 上で横比較・時系列比較ができなくなる。
 * その不変条件をここで機械的に担保する:
 *
 *   1. 使用する設問キーは正典レジストリ（registry.ts）に存在し、kind・文言が一致する
 *      （＝勝手に新キーを作らない／既存キーの意味を変えない）
 *   2. 1つのアンケート内で同じキーを二重に出さない
 *   3. 事後に出すスケール設問（§A〜C）は、必ず事前にも出す
 *      （report の「事前 → 事後」比較が成立する前提）
 */

import type { ContentSet } from "@/lib/content/types";
import {
  SURVEY_REGISTRY,
  CORE_COMPARABLE_KEYS,
  RECOMMENDED_KEYS,
  type QuestionKind,
} from "@/lib/content/registry";

type Used = { key: string; kind: QuestionKind; text: string };

/**
 * 検査結果。
 * - errors: データ契約違反。ビルド／起動をブロックする（比較不能になるため）。
 * - warnings: ガイドラインからの逸脱の指摘。ブロックはしない（正当な理由があれば残せる）。
 */
export interface ContentSetReport {
  setId: string;
  errors: string[];
  warnings: string[];
}

/** 事前アンケートで実際に保存されうる設問を集める */
function preQuestions(set: ContentSet): Used[] {
  const out: Used[] = [];
  const pre = set.survey.pre;
  if (pre.nendai) out.push({ key: "nendai", kind: "choice", text: SURVEY_REGISTRY["nendai"]?.text ?? "" });
  for (const s of pre.scaleSections) {
    for (const q of s.questions) out.push({ key: q.key, kind: "likert", text: q.text });
  }
  if (pre.choice) out.push({ key: pre.choice.key, kind: "choice", text: pre.choice.text });
  return out;
}

/** 事後アンケートで実際に保存されうる設問を集める */
function postQuestions(set: ContentSet): Used[] {
  const out: Used[] = [];
  const post = set.survey.post;
  for (const s of post.scaleSections) {
    for (const q of s.questions) out.push({ key: q.key, kind: "likert", text: q.text });
  }
  if (post.choice) out.push({ key: post.choice.key, kind: "choice", text: post.choice.text });
  if (post.evaluation) {
    for (const q of post.evaluation.questions) {
      out.push({ key: q.key, kind: q.kind === "nps" ? "nps" : "likert", text: q.text });
    }
  }
  if (post.freeText) {
    const e = SURVEY_REGISTRY["e_free"];
    out.push({ key: "e_free", kind: "text", text: e?.text ?? "" });
  }
  return out;
}

/** 使用設問が正典と一致するか・重複が無いかを検査 */
function checkAgainstRegistry(label: string, used: Used[], issues: string[]) {
  const seen = new Set<string>();
  for (const u of used) {
    if (seen.has(u.key)) {
      issues.push(`${label}: 設問キー "${u.key}" が重複しています。`);
    }
    seen.add(u.key);

    const canon = SURVEY_REGISTRY[u.key];
    if (!canon) {
      issues.push(
        `${label}: 設問キー "${u.key}" は正典レジストリに存在しません。surveyContent.ts に定義してから使ってください。`
      );
      continue;
    }
    if (canon.kind !== u.kind) {
      issues.push(
        `${label}: 設問キー "${u.key}" の種類が正典（${canon.kind}）と異なります（${u.kind}）。`
      );
    }
    if (canon.text !== u.text) {
      issues.push(
        `${label}: 設問キー "${u.key}" の文言が正典と異なります。同一キーは全コホートで同一文言にしてください。`
      );
    }
  }
}

/** 1つの研修セットを検査し、errors（ブロック）と warnings（指摘）を返す */
export function validateContentSet(set: ContentSet): ContentSetReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const pre = preQuestions(set);
  const post = postQuestions(set);

  // ── データ契約（errors・ブロック対象）─────────────────────────
  checkAgainstRegistry(`[${set.id}] 事前`, pre, errors);
  checkAgainstRegistry(`[${set.id}] 事後`, post, errors);

  // 事後のスケール設問は、必ず事前にも出す（変化量の比較が成立する前提）
  const preKeys = new Set(pre.map((q) => q.key));
  for (const s of set.survey.post.scaleSections) {
    for (const q of s.questions) {
      if (!preKeys.has(q.key)) {
        errors.push(
          `[${set.id}] 事後のスケール設問 "${q.key}" が事前に含まれていません。事前→事後の比較ができなくなります。`
        );
      }
    }
  }

  // ── ガイドライン（warnings・指摘のみ）────────────────────────
  const postKeys = new Set(post.map((q) => q.key));
  for (const key of CORE_COMPARABLE_KEYS) {
    if (!preKeys.has(key)) {
      warnings.push(
        `[${set.id}] 比較の中核設問 "${key}"（§A/§C）を事前で省いています。回をまたいだ横比較の主指標が取れません。意図的でなければ含めてください。`
      );
    } else if (!postKeys.has(key)) {
      warnings.push(
        `[${set.id}] 中核設問 "${key}" が事前にはあるのに事後にありません。事前→事後の変化量が測れません。`
      );
    }
  }
  for (const key of RECOMMENDED_KEYS) {
    if (!preKeys.has(key)) {
      warnings.push(
        `[${set.id}] 推奨設問 "${key}"（§D・外部ベンチマーク）を省いています。外部調査との突き合わせができなくなります。`
      );
    }
  }

  return { setId: set.id, errors, warnings };
}

/** すべての登録セットを検査。errors があれば例外を投げる（開発・ビルドで早期に気づくため）。 */
export function assertAllContentSetsValid(sets: Record<string, ContentSet>): void {
  const all: string[] = [];
  for (const set of Object.values(sets)) {
    all.push(...validateContentSet(set).errors);
  }
  if (all.length > 0) {
    throw new Error(
      "コンテンツセットのデータ契約違反が見つかりました:\n" + all.map((m) => `  - ${m}`).join("\n")
    );
  }
}
