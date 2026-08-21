/**
 * ブランド名・タグラインの単一の出所（Single Source of Truth）。
 *
 * 画面に表示するプロダクト名・タグラインはすべてここを参照する。
 * 変更はこの1ファイルだけで全画面に反映される。
 * ページ側での文字列ハードコードは禁止（この BRAND を import して使う）。
 */
export const BRAND = {
  /** プロダクト名（画面タイトル・ヘッダー・metadata） */
  name: "じぶん経営 戦略講座",
  /** タグライン（サブタイトル・キャッチコピー） */
  tagline: "セカンドエイジからサードエイジへのシフト戦略をつくろう",
  /** 事務局への問い合わせ先(自学習画面のフッターから起動) */
  contactEmail: "info@communitysociety.co.jp",
  /**
   * 送信メールの差出人表示名（受信箱に出る名前）。
   * 講座名だけだと初めて受け取る人に発信元が伝わらないため、運営会社を併記する。
   * アドレス側は FROM_EMAIL（noreply@communitysociety.co.jp）。
   */
  emailSenderName: "じぶん経営 戦略講座（COMMUNITY）",
} as const;
