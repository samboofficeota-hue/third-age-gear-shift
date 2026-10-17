/**
 * Day1「じぶんと社会の接点」の保存データ。
 * more＝いまよりも関わりを増やしたい接点／fresh＝あたらしく関わってみたい接点（どちらも文章）。
 * 旧版の have（見えている接点）・missing（見えていない接点）しか無いデータは、
 * それぞれ more・fresh の初期値として扱う（旧データを消さない）。
 */
export type SocialContactData = {
  more?: string;
  fresh?: string;
  /** 旧版（見えている接点）。初期値にだけ使う */
  have?: string[];
  /** 旧版（見えていない接点）。初期値にだけ使う */
  missing?: string[];
};

function legacy(items?: unknown): string {
  return Array.isArray(items)
    ? items.filter((s): s is string => typeof s === "string" && !!s.trim()).join("\n")
    : "";
}

/** 新しい項目が未記入（undefined）なら、旧版の記入を初期値として使う */
export function socialContactText(v: SocialContactData | null | undefined): {
  more: string;
  fresh: string;
} {
  return {
    more: typeof v?.more === "string" ? v.more : legacy(v?.have),
    fresh: typeof v?.fresh === "string" ? v.fresh : legacy(v?.missing),
  };
}
