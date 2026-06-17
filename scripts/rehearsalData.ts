/**
 * リハーサル用ダミーデータの定義（setup / teardown 共通）。
 * すべて namespace（メールドメイン・コード・組織名プレフィックス）で識別し、
 * teardown で完全削除できるようにしている。実データには絶対に混ざらない命名にすること。
 */

/** この値で始まる/終わるものは全部「リハ用ダミー」。teardown はこれを頼りに消す。 */
export const REHEARSAL_DOMAIN = "rehearsal.thirdage.test"; // 参加者/講師のメール
export const REHEARSAL_CODE = "REHEARSAL"; // 研修コード（WorkshopSession.code）
export const REHEARSAL_ORG_PREFIX = "[リハ] "; // 会社名プレフィックス
export const REHEARSAL_PASSWORD = "rehearsal"; // ダミーの共通パスワード

export const REHEARSAL_ORGS = [
  {
    name: `${REHEARSAL_ORG_PREFIX}あおぞら商事`,
    hasPositionRetirement: true,
    positionRetirementAge: 55,
    hasRetirement: true,
    retirementAge: 60,
  },
  {
    name: `${REHEARSAL_ORG_PREFIX}みどり製作所`,
    hasPositionRetirement: false,
    hasRetirement: true,
    retirementAge: 65,
  },
];

export const REHEARSAL_FACILITATOR = {
  email: `fac@${REHEARSAL_DOMAIN}`,
  name: "リハ 講師",
};

/** 参加者5名（会社・部署を散らす。p3 は部署なし＝太田さんパターン） */
export const REHEARSAL_PARTICIPANTS = [
  { email: `p1@${REHEARSAL_DOMAIN}`, name: "山田 太郎", department: "営業部", orgIndex: 0 },
  { email: `p2@${REHEARSAL_DOMAIN}`, name: "佐藤 花子", department: "人事部", orgIndex: 0 },
  { email: `p3@${REHEARSAL_DOMAIN}`, name: "鈴木 一郎", department: "", orgIndex: 1 },
  { email: `p4@${REHEARSAL_DOMAIN}`, name: "高橋 美咲", department: "製造一課", orgIndex: 1 },
  { email: `p5@${REHEARSAL_DOMAIN}`, name: "田中 健", department: "経営企画室", orgIndex: 0 },
];
