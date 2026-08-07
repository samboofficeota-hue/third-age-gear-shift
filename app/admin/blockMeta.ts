/**
 * 5フェーズ構成の管理画面向けメタ情報（id は lib/phases.ts の PHASE_IDS と一致）。
 * 説明文は管理者向けの概要。
 */
export const BLOCK_META = [
  {
    id: "pre",
    shortLabel: "事前課題",
    label: "事前課題",
    step: "PRE",
    description: "事前アンケート（スマホ対応）と じぶん紹介ワークシート。最初から開放。",
    tasks: ["事前アンケートに回答", "じぶん紹介を作成（Day1で発表）"],
    inputs: [
      "事前アンケート（§A〜D）",
      "じぶん紹介（名前・3ポイント・生い立ち・今の会社/仕事）",
    ],
    output: "事前アンケート回答 ＋ じぶん紹介を保存",
    day: "事前",
  },
  {
    id: "day1",
    shortLabel: "Day 1",
    label: "Day 1：じぶん分解・じぶん分析",
    step: "DAY 1",
    description:
      "じぶん分解（分人シェア／コミュニティポートフォリオ）と じぶん分析（好き得意／はたらくの原点／会社とじぶんの一致点）。",
    tasks: [
      "分人シェア・コミュニティポートフォリオを記入",
      "好き得意マトリクス・はたらくの原点・一致点を記入",
    ],
    inputs: [
      "分人シェア表",
      "コミュニティポートフォリオ",
      "好き得意 2×2",
      "はたらくの原点 A/B",
      "会社とじぶんの一致点",
    ],
    output: "Day1 ワークシートを保存",
    day: "DAY 1",
  },
  {
    id: "homework",
    shortLabel: "宿題",
    label: "宿題：みらいシナリオ",
    step: "HOMEWORK",
    description:
      "2040年のじぶんがいる社会を言語化（Vision／Issue／Reason）。AIが伴走（予定）。",
    tasks: ["#1 Vision（だれが・なにを・どう）を記入", "#2 Issue・#3 Reason を記入"],
    inputs: ["みらいシナリオ（複数可）"],
    output: "みらいシナリオを保存",
    day: "宿題",
  },
  {
    id: "day2",
    shortLabel: "Day 2",
    label: "Day 2：ビジョン・資本・シフト戦略",
    step: "DAY 2",
    description: "ビジョン策定／資本戦略（Wish-Can-Shall）／シフト戦略。（内容は改良中）",
    tasks: ["じぶんビジョンを策定", "資本戦略を棚卸し", "シフト戦略・一歩目を決める"],
    inputs: ["ビジョン策定シート", "資本戦略シート", "シフト戦略シート"],
    output: "Day2 ワークシートを保存",
    day: "DAY 2",
  },
  {
    id: "post",
    shortLabel: "事後課題",
    label: "事後課題",
    step: "POST",
    description: "事後アンケート（§A〜D共通＋§E研修評価）。スマホ対応。",
    tasks: ["事後アンケートに回答"],
    inputs: ["事後アンケート（§A〜E）"],
    output: "事後アンケート回答を保存",
    day: "事後",
  },
] as const;
