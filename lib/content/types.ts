/**
 * 研修セット（＝WorkshopSession）ごとのコンテンツ差し替え設定の型。
 *
 * 設計方針:
 * - 設定は「純粋なデータ」だけで表現する（prisma など server 専用の import を持たない）。
 *   → サーバー / クライアント どちらのコンポーネントからも同じ設定を読める。
 * - 個々の研修セットは lib/content/sets/*.ts に定義し、default からの差し替えを宣言する。
 * - 編集はこのリポジトリのファイルを直接書き換えて行う（管理画面に編集UIは持たせない）。
 *
 * 第1弾スコープ:
 *   ① アンケート（事前 / 事後）の設問の取捨選択・差し替え
 *   ② フェーズ / セクションのオンオフ
 * 企業向けの独自コンテンツ追加は次段階で拡張する。
 */

import type { PhaseId } from "@/lib/phases";
import type {
  ScaleSection,
  ChoiceQuestion,
  PostScaleQuestion,
} from "@/lib/surveyContent";

/** §E（研修評価）相当のセクション。事後アンケートで使う。 */
export interface EvaluationSection {
  id: string;
  title: string;
  questions: PostScaleQuestion[];
}

/** 事前アンケートの構成 */
export interface PreSurveyConfig {
  /** 年代（属性）設問を出すか */
  nendai: boolean;
  /** §A〜C の 5 段階セクション（並び順そのまま描画される） */
  scaleSections: ScaleSection[];
  /** §D（今後の働き方の方向性）。null なら §D と分岐設問を出さない */
  choice: ChoiceQuestion | null;
  /** §D の回答に応じた分岐設問（図2〜5）を出すか */
  reasonBranches: boolean;
}

/** 事後アンケートの構成 */
export interface PostSurveyConfig {
  /** §A〜C の 5 段階セクション（事前と揃えるのが基本） */
  scaleSections: ScaleSection[];
  /** §D。null なら出さない */
  choice: ChoiceQuestion | null;
  /** §D の分岐設問を出すか */
  reasonBranches: boolean;
  /** §E 研修評価。null なら出さない */
  evaluation: EvaluationSection | null;
  /** 自由記述（任意）を出すか */
  freeText: boolean;
}

/**
 * 研修セット1つ分のコンテンツ設定。
 */
export interface ContentSet {
  /** WorkshopSession.contentSetId と対応する識別子 */
  id: string;
  /** 管理画面のプルダウン表示用ラベル */
  label: string;
  /** 管理者向けの短い説明 */
  description: string;
  /**
   * コホート専用ランディング（/c/<code>）などで出す表示用ブランド。
   * 未指定の項目は全体共通の BRAND（lib/brand.ts）にフォールバックする。
   * ＝ 既定セットは brand 無しで従来どおり全体共通ブランドで表示される。
   */
  brand?: {
    /** 見出し（プロダクト名）。未指定なら BRAND.name */
    name?: string;
    /** サブタイトル。未指定なら BRAND.tagline */
    tagline?: string;
    /** 本文（説明）。未指定なら共通の既定文 */
    lead?: string;
  };
  /**
   * 受講者フローに含めるフェーズ。ここに無いフェーズは
   * ガイド・ゲーティング・保存API のいずれからも外れる。
   */
  phases: PhaseId[];
  /** アンケート構成 */
  survey: {
    pre: PreSurveyConfig;
    post: PostSurveyConfig;
  };
  /**
   * ワークシート内サブセクションのオンオフ。
   * キーは各シート側で定義（例: "day2.backcast"）。
   * 未指定キーは「有効（true）」とみなす（isSectionEnabled 参照）。
   */
  sections: Record<string, boolean>;
}
