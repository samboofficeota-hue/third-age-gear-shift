/**
 * Day2 のシートで使う定数（行定義・診断項目・レーダー設定）。
 */
import type { WCM, Summary } from "./_types";

export const WCM_ROWS: {
  key: keyof WCM;
  label: string;
  curSub: string;
  futLabel: string;
  futSub: string;
}[] = [
  {
    key: "will",
    label: "Will",
    curSub: "やりたいこと",
    futLabel: "Will",
    futSub: "ありたい姿",
  },
  {
    key: "can",
    label: "Can",
    curSub: "できること",
    futLabel: "Can",
    futSub: "できるようになりたいこと",
  },
  {
    key: "must",
    label: "Must",
    curSub: "するべきこと（義務）",
    futLabel: "Must（本分）",
    futSub: "なすべきこと",
  },
];

export const SUMMARY_ROWS: {
  key: keyof Summary;
  label: string;
  prompt: string;
  suffix: string;
  ph: string;
}[] = [
  {
    key: "must",
    label: "Must",
    prompt: "私の本分は",
    suffix: "だと思う。",
    ph: "なすべきこと",
  },
  {
    key: "will",
    label: "Will",
    prompt: "だから\nありたい姿は",
    suffix: "である。",
    ph: "ありたい姿",
  },
  {
    key: "issue",
    label: "Issue",
    prompt: "そのための\n今の課題は",
    suffix: "である。",
    ph: "今の課題",
  },
  {
    key: "flag",
    label: "Flag",
    prompt: "だからまず",
    suffix: "を目指す。",
    ph: "目標（旗）",
  },
  {
    key: "start",
    label: "Start",
    prompt: "そのために\n私は",
    suffix: "から始めていく。",
    ph: "一歩目",
  },
];

/** レーダーチャートの軸最大値（旧: 合計スコア 12 → 新: 平均 4 段階） */
export const SCORE_MAX = 4;
export const CIRCLED = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"];

/** 自己診断 #9 の項目（大項目／中項目／解説）。span は大項目セルの rowSpan */
export const DIAGNOSIS_ITEMS: {
  no: number;
  cat: string;
  span: number;
  name: string;
  desc: string;
}[] = [
  {
    no: 1,
    cat: "自己理解力",
    span: 3,
    name: "Will理解",
    desc: "自分のやりたいことやワクワク・情熱について理解している",
  },
  {
    no: 2,
    cat: "",
    span: 0,
    name: "Can理解",
    desc: "自分の強みや得意、力の発揮どころについて理解している",
  },
  {
    no: 3,
    cat: "",
    span: 0,
    name: "Must理解",
    desc: "自分に求められる役割や期待について理解している",
  },
  {
    no: 4,
    cat: "自分らしさ力",
    span: 4,
    name: "個性発揮力",
    desc: "集団の中で違う状態でいる力。他のメンバーに合わせすぎず個性を発揮する力",
  },
  {
    no: 5,
    cat: "",
    span: 0,
    name: "自己開示力",
    desc: "自分のことをオープンに話せる力。自分のことを適切に語ってまわりに共有する力",
  },
  {
    no: 6,
    cat: "",
    span: 0,
    name: "援助希求力",
    desc: "困った時や悩んでいるときに誰かに頼れる力。自分の弱さも他者と共有できる力",
  },
  {
    no: 7,
    cat: "",
    span: 0,
    name: "距離確保力",
    desc: "自分がつらく感じたときに、状況に応じてコミュニティやメンバーと距離を置く力",
  },
  {
    no: 8,
    cat: "環境適応力",
    span: 3,
    name: "傾聴力",
    desc: "他者の話をしっかりと聴く力。相手の気持ちに寄り添い、共感的理解や関心を示す力",
  },
  {
    no: 9,
    cat: "",
    span: 0,
    name: "他者受容力",
    desc: "相手の個性や存在をあたたかく受け容れる力。包括的にまるごと受け容れる力",
  },
  {
    no: 10,
    cat: "",
    span: 0,
    name: "多様性許容力",
    desc: "違いを認めて尊重する力。共感・同意できないものがあっても尊重する姿勢",
  },
];

/**
 * コミュニティ活動力診断の基準平均（4段階のまま。no=1〜10はDIAGNOSIS_ITEMSと対応）。
 * サードエイジHP（third-age-project の communityCheck.ts）の referenceAverages と同じ値
 * （community-skill-questions.xlsx の各設問「平均」を軸ごと・3問平均したもの）。
 * レーダーチャートで「あなた」に重ねる参考値として使う。表示時は toFivePoint で5点満点へ換算する。
 */
export const DIAGNOSIS_REFERENCE_AVERAGES: Record<number, number> = {
  1: 3.12, // Will理解
  2: 3.0266666666666664, // Can理解
  3: 2.8933333333333335, // Must理解
  4: 2.9466666666666668, // 個性発揮力
  5: 2.9333333333333336, // 自己開示力
  6: 2.8533333333333335, // 援助希求力
  7: 2.8533333333333335, // 距離確保力
  8: 3.013888888888889, // 傾聴力
  9: 2.930555555555556, // 他者受容力
  10: 2.9444444444444446, // 多様性許容力
};

/** 30問モーダルのセクション定義（communityCheck.ts から移植） */
export type DiagnosisQuestion = { id: string; text: string };
export type DiagnosisSection = {
  label: string;
  title?: string;
  legend?: string;
  dimNo: number;
  startQ: number;
  questions: DiagnosisQuestion[];
};

export const DIAGNOSIS_SECTIONS: DiagnosisSection[] = [
  {
    label: "自己理解力①",
    title: "Will理解（意欲・情熱）",
    legend:
      "4段階：1 全くあてはまらない ／ 2 あまりあてはまらない ／ 3 ややあてはまる ／ 4 とてもあてはまる",
    dimNo: 1,
    startQ: 1,
    questions: [
      { id: "cc_q1", text: "自分がこのコミュニティで本当に「やりたいこと」が何であるかを明確に言葉にできる。" },
      { id: "cc_q2", text: "活動に参加する際、自分自身の「わくわくする気持ち」や「情熱」を大切にしている。" },
      { id: "cc_q3", text: "自分が心から関心を持てるテーマやプロジェクトを、自ら見出すことができる。" },
    ],
  },
  {
    label: "自己理解力②",
    title: "Can理解（強み・スキル）",
    dimNo: 2,
    startQ: 4,
    questions: [
      { id: "cc_q4", text: "自分の得意なことやスキルが、コミュニティ内でどう活かせるかを理解している。" },
      { id: "cc_q5", text: "他のメンバーと比較して、自分が貢献しやすい「強み」を自覚している。" },
      { id: "cc_q6", text: "これまでの経験や知識を、活動に還元する方法を知っている。" },
    ],
  },
  {
    label: "自己理解力③",
    title: "Must理解（役割認識）",
    dimNo: 3,
    startQ: 7,
    questions: [
      { id: "cc_q7", text: "コミュニティの中で、自分が周囲から何を期待されているかを的確に捉えている。" },
      { id: "cc_q8", text: "自分が担うべき役割や責任範囲を明確に理解して行動している。" },
      { id: "cc_q9", text: "状況の変化に応じて、自分に求められる役割がどう変わるかを感じ取ることができる。" },
    ],
  },
  {
    label: "自分らしさ力④",
    title: "個性発揮力",
    dimNo: 4,
    startQ: 10,
    questions: [
      { id: "cc_q10", text: "周囲の意見にただ同調するのではなく、自分なりの視点や意見を表現できている。" },
      { id: "cc_q11", text: "集団の中で「自分は他者とは違う」という状態を恐れず、自然体でいられる。" },
      { id: "cc_q12", text: "同調圧力を感じたときでも、自分らしさを失わずに振る舞うことができる。" },
    ],
  },
  {
    label: "自分らしさ力⑤",
    title: "自己開示力",
    dimNo: 5,
    startQ: 13,
    questions: [
      { id: "cc_q13", text: "自分のプライベートなことや個人的な思いを、メンバーに対してオープンに話すことができる。" },
      { id: "cc_q14", text: "自分の考えや感じていることを、適切なタイミングと方法で周囲に共有している。" },
      { id: "cc_q15", text: "失敗談や過去の経験など、自分の等身大の姿を隠さずに見せることができる。" },
    ],
  },
  {
    label: "自分らしさ力⑥",
    title: "援助希求力",
    dimNo: 6,
    startQ: 16,
    questions: [
      { id: "cc_q16", text: "困ったことや悩んでいることがあれば、一人で抱え込まずに誰かに相談できる。" },
      { id: "cc_q17", text: "自分の弱さや「できないこと」を素直に認め、他者にサポートを求めることができる。" },
      { id: "cc_q18", text: "誰かに頼ることは恥ずかしいことではなく、お互い様だと捉えることができている。" },
    ],
  },
  {
    label: "自分らしさ力⑦",
    title: "距離確保力",
    dimNo: 7,
    startQ: 19,
    questions: [
      { id: "cc_q19", text: "人間関係や活動が負担になったとき、無理をせずに適度な距離を置くことができる。" },
      { id: "cc_q20", text: "自分の心身の健康を最優先し、参加頻度や関わり方を柔軟に調整できている。" },
      { id: "cc_q21", text: "「少し休みたい」「離れたい」と感じたとき、それに罪悪感を抱かずに休むことができる。" },
    ],
  },
  {
    label: "環境適応力⑧",
    title: "傾聴力",
    dimNo: 8,
    startQ: 22,
    questions: [
      { id: "cc_q22", text: "他者が話しているとき、途中で遮ったり否定したりせず、最後までしっかりと耳を傾けている。" },
      { id: "cc_q23", text: "相手の言葉の裏にある「感情」や「本当の思い」に寄り添って話を聴くことができる。" },
      { id: "cc_q24", text: "自分の意見とは異なる話であっても、まずは「相手はそう感じているのだ」と受け止めて聴くことができる。" },
    ],
  },
  {
    label: "環境適応力⑨",
    title: "他者受容力",
    dimNo: 9,
    startQ: 25,
    questions: [
      { id: "cc_q25", text: "メンバーそれぞれの個性や性格の偏りを、「その人らしさ」としてあたたかく受け容れている。" },
      { id: "cc_q26", text: "相手の欠点や不完全な部分を含めて、まるごと肯定的に捉えることができる。" },
      { id: "cc_q27", text: "誰かが失敗したり間違えたりしたときでも、非難せずに寛容な態度で接することができる。" },
    ],
  },
  {
    label: "環境適応力⑩",
    title: "多様性許容力",
    dimNo: 10,
    startQ: 28,
    questions: [
      { id: "cc_q28", text: "自分と全く異なる価値観や意見を持つ人に出会ったとき、その違いを尊重することができる。" },
      { id: "cc_q29", text: "相手の意見にどうしても共感や同意ができない場合でも、その人の存在や主張を否定しない。" },
      { id: "cc_q30", text: "コミュニティ内に対立や意見の相違があっても、それを「多様性」として前向きに捉えることができる。" },
    ],
  },
];

/** ポートフォリオ比較ステップで縮小表示するときの倍率 */
export const MINI_SCALE = 0.62;
export const MINI_W = Math.round(660 * MINI_SCALE);
