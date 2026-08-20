export type AssetKey = "productivity" | "vitality" | "transformation";
export type AssetAnswers = [string, string, string];
export type AssetsData = Partial<Record<AssetKey, AssetAnswers>>;

export const ASSET_KEYS: AssetKey[] = ["productivity", "vitality", "transformation"];

export const EMPTY_ANSWERS: AssetAnswers = ["", "", ""];

export type AssetMeta = {
  key: AssetKey;
  label: string;
  color: string;
  description: string;
  /** 回答欄の上に置く、資産ごとの質問タイトル */
  questionTitle: string;
  /** 各設問のプレースホルダーに添える、資産ごとの問いかけ */
  hint: string;
};

export const ASSET_META: Record<AssetKey, AssetMeta> = {
  productivity: {
    key: "productivity",
    label: "生産性資産",
    color: "#2E9FE0",
    description:
      "仕事の生産性を高め所得を増やすもの（スキル、知識、評判）\n誰かのために役に立てることができる得意なこと",
    questionTitle: "どんな生産性資産がありますか。最大3つで考えてみてください。",
    hint: "どんな経験から生まれた？",
  },
  vitality: {
    key: "vitality",
    label: "活力資産",
    color: "#F0A939",
    description:
      "身体的・精神的な健康を維持するもの。日々の生活の「基盤」\n明日もがんばろう、と自分をリチャージするもの（家族・友人関係・生活環境）",
    questionTitle: "どんな活力資産がありますか。最大3つで考えてみてください。",
    hint: "どんな経緯で維持されている",
  },
  transformation: {
    key: "transformation",
    label: "変身資産",
    color: "#8BC63F",
    description:
      "自己を変身させる意志と能力。外的環境や、内なる思いに触発されて発揮されるもの（自分への理解、外との関係、新しい経験や自分の姿勢）",
    questionTitle: "どんな変身資産がありますか。最大3つで考えてみてください。",
    hint: "どんな時に発揮された？",
  },
};

export function hasText(answers: unknown): boolean {
  if (!Array.isArray(answers)) return false;
  return answers.some((v) => typeof v === "string" && v.trim().length > 0);
}
