# 研修セットごとのコンテンツ差し替え（コンテンツセット）

研修の開催回（＝`WorkshopSession`）ごとに、**アンケートの設問**や**実施するフェーズ**を
差し替えられる仕組み。個人向けワークショップ回では宿題を省いてアンケートを簡素化し、
企業向け研修回では独自構成にする、といった出し分けを1つの設定で行う。

- **編集はこのリポジトリのファイルを直接書き換えて行う**（管理画面に凝った編集UIは持たせない方針）。
- 管理画面（研修の作成・編集フォーム）では「どのコンテンツセットを使うか」をプルダウンで選ぶだけ。

## 仕組み

```
WorkshopSession.contentSetId ──▶ lib/content/sets/<id>.ts (ContentSet)
      │                                   │
      │ 管理画面のプルダウンで選ぶ          │ アンケート構成 / 有効フェーズ / セクションのオンオフ
      ▼                                   ▼
  受講者の各画面（事前・事後アンケート、ガイド、ゲーティング、保存API）が
  自分のセッションのセットを読んで描画・判定する
```

- 単一の情報源: `lib/content/sets/index.ts` の `CONTENT_SETS`
- 既定は `default`（`lib/content/sets/default.ts`）＝現行の標準構成。
  どの研修も未設定なら default になる。未知の id も default にフォールバックする。
- 型は `lib/content/types.ts` の `ContentSet`。

## 新しい研修セットを追加する手順

1. `lib/content/sets/<新id>.ts` を作る。`default` を土台に、変えたいところだけ差し替える。
   （見本: `lib/content/sets/kojin-workshop.ts`）

   ```ts
   import type { ContentSet } from "@/lib/content/types";
   import { DEFAULT_CONTENT_SET } from "@/lib/content/sets/default";

   export const ACME_SET: ContentSet = {
     ...DEFAULT_CONTENT_SET,
     id: "acme-2026",
     label: "ACME社 2026",
     description: "…",
     phases: ["pre", "day1", "homework", "day2", "post"], // 実施フェーズ
     survey: {
       pre: { ...DEFAULT_CONTENT_SET.survey.pre, /* 差し替え */ },
       post: { ...DEFAULT_CONTENT_SET.survey.post, /* 差し替え */ },
     },
   };
   ```

2. `lib/content/sets/index.ts` の `CONTENT_SETS` に登録する。
3. 管理画面 → 研修の作成／編集フォームの「コンテンツセット」で、その研修に割り当てる。

## 差し替えできること（第1弾）

| 対象 | 設定 | 例 |
|------|------|----|
| 実施フェーズ | `phases` | 宿題を省く → `["pre","day1","day2","post"]` |
| 事前アンケート | `survey.pre` | 年代属性の有無 / §A〜C の取捨 / §D の有無 / 分岐設問の有無 |
| 事後アンケート | `survey.post` | §A〜C / §D / §E 研修評価 / 自由記述 の有無 |
| ワークシート内サブセクション | `sections` | `{ "day2.backcast": false }` のように無効化（対応シート側で `isSectionEnabled` を参照） |

アンケートの設問そのもの（文言・選択肢）は `lib/surveyContent.ts` に集約されている。
新しい設問を足したいときはそこに定義し、セット側の `scaleSections` などで組み合わせる。

## 注意

- `lib/content/` 配下（`resolve.ts` を除く）は **prisma などサーバー専用の import を持たせない**。
  事前・事後アンケートはクライアントコンポーネントからも同じ設定を読むため。
  サーバーでの解決（ユーザー→セッション→セット）は `lib/content/resolve.ts` を使う。
- 企業向けの独自スライド・資料の追加は次段階での拡張対象（この第1弾には含まない）。
