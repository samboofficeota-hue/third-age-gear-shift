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

/** レーダーチャートの軸最大値 */
export const SCORE_MAX = 12;
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

/** ポートフォリオ比較ステップで縮小表示するときの倍率 */
export const MINI_SCALE = 0.62;
export const MINI_W = Math.round(660 * MINI_SCALE);
