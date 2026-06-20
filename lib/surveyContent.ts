/**
 * アンケート（事前・事後）の設問コピー集約。
 * 日本語の文言はここで一元管理し、差し替えを容易にする。
 * 事前 = §A〜D。事後 = §A〜D（共通）＋§E。§F は3ヶ月後フォロー（別送）。
 *
 * 設計方針（調査票より）: 事前・事後で同一設問(§A〜D)、変化量を測る。5段階中心。
 * 会社へは匿名集計のみ。所要約5分。
 */

export const SCALE_MIN = 1;
export const SCALE_MAX = 5;
export const SCALE_MIN_LABEL = "そう思わない";
export const SCALE_MAX_LABEL = "そう思う";
/** 各段階の説明（ツールチップ/凡例用） */
export const SCALE_LABELS = [
  "そう思わない",
  "あまりそう思わない",
  "どちらともいえない",
  "ややそう思う",
  "そう思う",
] as const;

export type ScaleQuestion = { key: string; text: string };
export type ScaleSection = { id: string; title: string; questions: ScaleQuestion[] };
export type ChoiceQuestion = {
  key: string;
  title: string;
  text: string;
  options: { value: string; label: string }[];
};

/** §A キャリア自律意識（6問・5段階・事前事後共通） */
export const SECTION_A: ScaleSection = {
  id: "A",
  title: "キャリア自律意識",
  questions: [
    { key: "a1", text: "自分のキャリアは、会社任せにせず自分で考えて切り拓くものだと思う" },
    { key: "a2", text: "今後のキャリアについて、定期的に考える時間を持っている" },
    { key: "a3", text: "環境が変わっても、新しい役割ややり方に自分は適応できると思う" },
    { key: "a4", text: "これまでの自分の経験は、今の会社の外でも通用する価値があると思う" },
    { key: "a5", text: "60歳以降の働き方・過ごし方について、具体的なイメージを持っている" },
    { key: "a6", text: "今後のキャリアを考えることは、不安より期待のほうが大きく、楽しみだ" },
  ],
};

/** §B 自己理解 Want/Can/Must（3問・5段階・事前事後共通） */
export const SECTION_B: ScaleSection = {
  id: "B",
  title: "自己理解 — Want / Can / Must",
  questions: [
    { key: "b1", text: "自分の「やりたいこと・わくわくすること」を、自分の言葉で説明できる（Want）" },
    { key: "b2", text: "自分の「強み・力を発揮できる場面」を、自分の言葉で説明できる（Can）" },
    { key: "b3", text: "自分が周囲から求められている「役割・期待」を理解している（Must）" },
  ],
};

/** §C 行動意図・つながり（4問・5段階・事前事後共通） */
export const SECTION_C: ScaleSection = {
  id: "C",
  title: "行動意図・つながり",
  questions: [
    { key: "c1", text: "今の会社の中で、やってみたい・挑戦したいことがある" },
    { key: "c2", text: "会社の外で、やってみたいことがある（学び・副業・地域活動など）" },
    { key: "c3", text: "キャリアについて本音で話せる相手が、社外にいる" },
    { key: "c4", text: "この3か月以内に、キャリアに関する具体的な行動（情報収集・相談・申込みなど）を起こすつもりだ" },
  ],
};

/**
 * 年代（属性）— 産業雇用安定センター調査と比較するための区分。
 * ベンチマークは 45〜59歳。前後も取れるよう 45未満/60以上 を含める。
 */
export const NENDAI: ChoiceQuestion = {
  key: "nendai",
  title: "年代",
  text: "あなたの年代をお選びください",
  options: [
    { value: "u45", label: "45歳未満" },
    { value: "45-49", label: "45〜49歳" },
    { value: "50-54", label: "50〜54歳" },
    { value: "55-59", label: "55〜59歳" },
    { value: "60+", label: "60歳以上" },
  ],
};

/**
 * §D 今後の働き方の方向性（1問・単一選択・事前事後共通）
 * 産業雇用安定センター「ミドルシニア世代のセカンドキャリアに関する意識調査」図1 と同一区分。
 */
export const SECTION_D: ChoiceQuestion = {
  key: "d1",
  title: "今後の働き方の方向性",
  text: "定年前後の働き方について、現時点のお考えに最も近いものは？",
  options: [
    { value: "1", label: "定年前に、転職または独立したい" },
    { value: "2", label: "定年を契機に、転職または独立したい" },
    { value: "3", label: "定年後は同じ会社（グループ）で雇用延長し、そこから転職または独立したい" },
    { value: "4", label: "定年後は同じ会社（グループ）で雇用延長し、そこで働くのをやめたい" },
    { value: "5", label: "定年をもって働くのをやめたい" },
    { value: "6", label: "まだ決めていない" },
  ],
};

/**
 * §D の回答に応じて出し分ける「理由」設問（図2〜5）。
 * 選択肢は産業雇用安定センター調査の文言に準拠。
 */

/** 図2 定年前・定年時に転職を希望する理由（§D=1,2 のとき・単一選択） */
export const REASON_TENSHOKU: ChoiceQuestion = {
  key: "d_tenshoku",
  title: "転職を希望する理由",
  text: "転職・独立を考える、最も大きな理由は？",
  options: [
    { value: "skill", label: "スキル・経験を他社または独立で生かして活躍したいから" },
    { value: "new", label: "これまでと違う新しい仕事に取り組んでみたいから" },
    { value: "family", label: "家族の事情（親の介護・孫の世話など）に合わせた働き方をしたいから" },
    { value: "unwanted", label: "会社に残ると希望しない仕事をしないといけなくなるから" },
    { value: "treatment", label: "役職定年や定年によって処遇が大きく下がるから" },
    { value: "other", label: "その他" },
  ],
};

/** 図3 定年後も同じ会社で雇用延長を希望する理由（§D=3,4 のとき・単一選択） */
export const REASON_KOYOU: ChoiceQuestion = {
  key: "d_koyou",
  title: "雇用延長を希望する理由",
  text: "今の会社で雇用延長を考える、最も大きな理由は？",
  options: [
    { value: "skill_here", label: "自らのスキルや経験を今の会社で生かせるから" },
    { value: "comfortable", label: "働きやすい職場だから" },
    { value: "anxiety_new", label: "新しい職場に馴染めるか不安だから" },
    { value: "no_market_skill", label: "労働市場でアピールできるスキルや経験が無いと思うから" },
    { value: "hard_to_move", label: "中・高齢期の転職は難しいと思うから" },
    { value: "worse_terms", label: "転職すると待遇や労働条件が悪くなる恐れがあるから" },
    { value: "other", label: "その他" },
  ],
};

/** 図4 中小企業等でのセカンドキャリア挑戦意欲（§D=4,5,6 のとき・単一選択） */
export const CHALLENGE_CHUSHO: ChoiceQuestion = {
  key: "d_chusho",
  title: "中小企業等への挑戦意欲",
  text: "大企業での経験等を生かして中小企業・NPOに挑戦することについては？",
  options: [
    { value: "yes_need", label: "自分の知識・経験を必要とする中小企業・NPOがあれば挑戦してもよい" },
    { value: "yes_fit", label: "中小企業等で生かせる知識・経験はないが、自分に合った職場があれば挑戦してもよい" },
    { value: "no", label: "中小企業等で生かせる知識・経験はなく、挑戦するつもりはない" },
    { value: "stop", label: "今の会社をもって働くのをやめたい" },
  ],
};

/** 図5 転職（独立）に向けて会社に求める支援（複数選択） */
export const SUPPORT: ChoiceQuestion = {
  key: "d_support",
  title: "会社に求める支援",
  text: "転職・独立に向けて、会社に求める支援は？（複数選択可）",
  options: [
    { value: "life_seminar", label: "定年後の年金、資産管理などのライフセミナーの実施" },
    { value: "reskill", label: "リスキリングなどのスキルアップ支援" },
    { value: "market_info", label: "労働市場の情報や求人情報、転職事例などの提供" },
    { value: "intro", label: "具体的な転職先の紹介、出向を利用した転職支援などの制度" },
    { value: "flexible", label: "副業・兼業など多様な働き方が可能な仕組みの整備" },
    { value: "consult", label: "OBや専門家による相談・支援サービスの整備" },
    { value: "other", label: "その他" },
    { value: "none", label: "特にない" },
  ],
};

/**
 * §D（と図4）の回答から、どの理由設問を出すかを判定。
 * 図2: §D=1,2 / 図3: §D=3,4 / 図4: §D=4,5,6 / 図5: §D=1,2,3 または 図4で「挑戦してもよい」
 */
export function preReasonFlags(answers: Record<string, unknown>) {
  const d = answers["d1"];
  const chusho = answers["d_chusho"];
  return {
    showTenshoku: d === "1" || d === "2",
    showKoyou: d === "3" || d === "4",
    showChusho: d === "4" || d === "5" || d === "6",
    showSupport:
      d === "1" || d === "2" || d === "3" || chusho === "yes_need" || chusho === "yes_fit",
  };
}

/**
 * §D の変更などで非表示になった分岐設問の回答を取り除く。
 * （例: §D=④で図4に答えた後 §D=③へ変えると、図4の回答 d_chusho が残るのを防ぐ）
 */
export function pruneReasonAnswers<T extends Record<string, unknown>>(answers: T): T {
  const f = preReasonFlags(answers);
  const next = { ...answers } as Record<string, unknown>;
  if (!f.showTenshoku) delete next[REASON_TENSHOKU.key];
  if (!f.showKoyou) delete next[REASON_KOYOU.key];
  if (!f.showChusho) delete next[CHALLENGE_CHUSHO.key];
  if (!f.showSupport) delete next[SUPPORT.key];
  return next as T;
}

/** 事前アンケートで使う構成 */
export const PRE_NENDAI = NENDAI;
export const PRE_SCALE_SECTIONS: ScaleSection[] = [SECTION_A, SECTION_B, SECTION_C];
export const PRE_CHOICE = SECTION_D;

/** 記入例（サンプル）回答 — 太田義史さん（差し替え可）。d1="3" なので図3＋図5が出る。 */
export const PRE_SAMPLE: Record<string, number | string | string[]> = {
  nendai: "50-54",
  a1: 5, a2: 3, a3: 4, a4: 4, a5: 3, a6: 4,
  b1: 4, b2: 4, b3: 3,
  c1: 4, c2: 5, c3: 3, c4: 4,
  d1: "3",
  d_koyou: "skill_here",
  d_support: ["reskill", "flexible", "intro"],
};

/**
 * §E 研修評価（事後直後・5問）
 * 5段階リッカート（E1, E3, E4, E5） ＋ NPS 0-10（E2）の混在。
 */
export type PostScaleKind = "likert" | "nps";
export type PostScaleQuestion = {
  key: string;
  text: string;
  kind: PostScaleKind;
  minLabel?: string;
  maxLabel?: string;
};

export const SECTION_E: {
  id: string;
  title: string;
  questions: PostScaleQuestion[];
} = {
  id: "E",
  title: "研修評価",
  questions: [
    { key: "e1", text: "この研修全体に満足している", kind: "likert" },
    {
      key: "e2",
      text: "この研修を、同年代の同僚にすすめたいと思う",
      kind: "nps",
      minLabel: "まったく勧めない",
      maxLabel: "強く勧める",
    },
    { key: "e3", text: "「シフト戦略」に書いた内容は、納得できるものになった", kind: "likert" },
    { key: "e4", text: "講師（ファシリテーター）の進行・関わり方は満足できるものだった", kind: "likert" },
    { key: "e5", text: "一緒に学んだ他の参加者から、刺激や気づきを得られた", kind: "likert" },
  ],
};

/** 事後アンケートの自由記述（任意） */
export const POST_FREETEXT = {
  key: "e_free",
  label: "研修を通じて気づいたこと・これからやってみようと思ったこと",
  hint: "（任意）",
  placeholder: "（自由にお書きください）",
};

/** 事後直後アンケートで使う構成（§A〜D は事前と同一。§E を追加） */
export const POST_SCALE_SECTIONS: ScaleSection[] = PRE_SCALE_SECTIONS;
export const POST_CHOICE = SECTION_D;
export const POST_NENDAI = NENDAI;

/**
 * §F 3ヶ月後フォロー（別送・3問）
 * Vercel Cron + メール送信が実装されてから出番。
 * f1=yes のときだけ f2 を表示。
 */
export const SECTION_F_F1: ChoiceQuestion = {
  key: "f1",
  title: "行動の有無",
  text: "研修後、キャリアに関する具体的な行動を起こしましたか？",
  options: [
    { value: "yes", label: "はい" },
    { value: "no", label: "いいえ" },
  ],
};

export const SECTION_F_F2: ChoiceQuestion = {
  key: "f2",
  title: "起こした行動",
  text: "どんな行動ですか？（複数選択可）",
  options: [
    { value: "internal", label: "社内公募・異動希望" },
    { value: "boss_hr", label: "上司・人事との面談" },
    { value: "learn", label: "学習・資格" },
    { value: "side", label: "副業・兼業の検討着手" },
    { value: "community", label: "社外コミュニティ・地域活動への参加" },
    { value: "family", label: "家族との話し合い" },
    { value: "other", label: "その他" },
  ],
};

export const SECTION_F_F3: ChoiceQuestion = {
  key: "f3",
  title: "つながり",
  text: "研修で出会った人と、その後つながりはありますか？",
  options: [
    { value: "yes", label: "はい" },
    { value: "no", label: "いいえ" },
  ],
};
