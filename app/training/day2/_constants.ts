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
      { id: "cc_q2", text: "「わくわくする気持ち」や「情熱」を基準にして、自ら関わる役割やタスクを選び取っている。" },
      { id: "cc_q3", text: "既存の役割をこなすだけでなく、自分の興味や関心を起点に、具体的な活動やプロジェクトを進めている。" },
    ],
  },
  {
    label: "自己理解力②",
    title: "Can理解（強み・スキル）",
    dimNo: 2,
    startQ: 4,
    questions: [
      { id: "cc_q4", text: "自分の得意なことやスキルを活かして、コミュニティの具体的な活動や課題解決に貢献している。" },
      { id: "cc_q5", text: "自分の「強み」が最も活きる役割を自ら選び、コミュニティ内で意図的に発揮している。" },
      { id: "cc_q6", text: "これまでの経験や知識を、活動に還元する方法を知っている。" },
    ],
  },
  {
    label: "自己理解力③",
    title: "Must理解（役割認識）",
    dimNo: 3,
    startQ: 7,
    questions: [
      { id: "cc_q7", text: "周囲からの期待やニーズをくみ取り、自分が果たすべき役割を自ら考えて動いている。" },
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
      { id: "cc_q10", text: "全体の意見が自分の考えと違う場面でも、同調圧力を恐れず、自分なりの異なる視点を発言している。" },
      { id: "cc_q11", text: "集団の中で「自分は周囲と違う」と感じる場面でも、無理に合わせることなく自然体で振る舞えている。" },
      { id: "cc_q12", text: "同調圧力を感じたときでも、自分らしさを失わずに振る舞うことができる。" },
    ],
  },
  {
    label: "自分らしさ力⑤",
    title: "自己開示力",
    dimNo: 5,
    startQ: 13,
    questions: [
      { id: "cc_q13", text: "業務や活動の話だけでなく、自分の個人的な価値観やバックグラウンドについても進んで話している。" },
      { id: "cc_q14", text: "自分の考えや感じていることを、日常的に必要なタイミングで周囲に共有している。" },
      { id: "cc_q15", text: "自分を良く見せようとせず、過去の失敗談や現在の苦手なことも含めてオープンにさらけ出している。" },
    ],
  },
  {
    label: "自分らしさ力⑥",
    title: "援助希求力",
    dimNo: 6,
    startQ: 16,
    questions: [
      { id: "cc_q16", text: "困りごとや悩みがある時は、一人で抱え込まず、早めに周囲のメンバーへ相談するようにしている。" },
      { id: "cc_q17", text: "自分が「できないこと」に直面した際、無理をして抱え込まず、他者に具体的なサポートを依頼している。" },
      { id: "cc_q18", text: "誰かに頼るべき場面では、ためらわずに相手に任せたりお願いしたりできる。" },
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
      { id: "cc_q21", text: "「少し休みたい」「離れたい」と感じたとき、過度な引け目を感じることなく休むことができる。" },
    ],
  },
  {
    label: "環境適応力⑧",
    title: "傾聴力",
    dimNo: 8,
    startQ: 22,
    questions: [
      { id: "cc_q22", text: "相手の話がまとまっていなくても、途中で話を遮ったり自分の意見を挟んだりせず、最後まで耳を傾けている。" },
      { id: "cc_q23", text: "相手の言葉の表面的な意味だけでなく、声のトーンや表情から「本当に伝えたい感情」を推し量りながら聴いている。" },
      { id: "cc_q24", text: "話が長く、面倒に感じる話であっても、適当に聞き流すことなく、相手に寄り添う姿勢で話を聴いている。" },
    ],
  },
  {
    label: "環境適応力⑨",
    title: "他者受容力",
    dimNo: 9,
    startQ: 25,
    questions: [
      { id: "cc_q25", text: "自分にとって「扱いにくい」と感じるメンバーに対しても、距離を置くのではなく、その人の個性を活かす関わり方を探っている。" },
      { id: "cc_q26", text: "相手の欠点や不完全な部分を「直すべきもの」として否定するのではなく、人それぞれの個性として受け入れている。" },
      { id: "cc_q27", text: "誰かがミスをした時、個人の責任を追及するのではなく、チーム全体でどうカバーし次に活かすかを考える態度をとっている。" },
    ],
  },
  {
    label: "環境適応力⑩",
    title: "多様性許容力",
    dimNo: 10,
    startQ: 28,
    questions: [
      { id: "cc_q28", text: "全く異なる価値観を持つ相手に対しても、拒絶するのではなく、関心を持って対話しようと努めている。" },
      { id: "cc_q29", text: "相手の意見にどうしても共感や同意ができない場合でも、その人の存在や主張を否定せず、理解しようと努めている。" },
      { id: "cc_q30", text: "コミュニティ内に対立や意見の相違があっても、それを「多様性」として前向きに捉えることができる。" },
    ],
  },
];

/** ポートフォリオ比較ステップで縮小表示するときの倍率 */
export const MINI_SCALE = 0.62;
export const MINI_W = Math.round(660 * MINI_SCALE);
