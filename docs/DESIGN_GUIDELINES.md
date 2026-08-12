# デザインガイドライン

じぶん経営研究所 Webアプリのデザイン仕様書。
モックアップ（`common.css` / `index.html`）のテイストをベースに、Next.js + Tailwind CSS + shadcn/ui 実装へ翻訳したルール集。

---

## 0. 大原則（コーディング規約）

UI実装は次の原則を最優先で守る。**これが破られている＝直す対象**。

1. **世界観は「ネオン×ダーク」を維持**。色は変えない。整えるのはタイポグラフィ・行間・余白・カード・文言の「規律」。
2. **個別のハードコード禁止**。ページ/コンポーネントに任意値を書かない：`text-[#...]`・`bg-[#...]`・`border-[rgba(...)]`・生の16進カラー・`bg-stone-50` のような文脈外の色。
3. **単一の出所（Single Source of Truth）に従う**：
   - 色・影・角丸・タイプスケール → `tailwind.config.ts` のトークン
   - 可変ルート文字サイズ・見出しリズム・**セマンティッククラス** → `app/globals.css`
   - ブランド名・タグライン等の**文言** → `lib/brand.ts` の `BRAND`
4. **不足はまず出所に足す**。必要なパターンが無ければ、ページに直書きせず `globals.css` の `@layer components` にクラスを定義してから使う。
5. 確認は参加者の**導線順**（トップ→ログイン→登録→ダッシュボード→事前→研修→事後）。実物は `/design`（スタイルガイド）で一望。

### セマンティッククラス一覧（`app/globals.css`）

| クラス | 用途 |
|---|---|
| `.eyebrow` | 英字・大文字・ネオンの小ラベル |
| `.lead` | 導入文（本文より一段大きい） |
| `.subtitle` | 見出し直下の説明・メタ |
| `.callout` | 囲み・注記ボックス（アイコン＋文） |
| `.brand-chip` | ⚙️ 等を入れる角丸ロゴチップ（ネオングロー） |
| `.nav-card`（`.is-locked` / `.is-feature`） | クリックできる導線カード（横長メニュー行） |
| `.icon-chip`（`.is-muted` / `.is-solid`） | 丸アイコンチップ |
| `.card-eyebrow` / `.nav-card-title` / `.nav-card-note` | カード内の小ラベル・見出し・説明 |
| `.tag-done` | 完了などの小タグ |

### 文字サイズ（可変ルート）

モバイル `17px` / 標準 `18px` / 大画面(≥1280px) `20px`。タイプスケールは rem 基準で連動。
**A4ワークシートは印刷時 `16px` 固定**（`@media print`）で原寸維持。
スケールは `tailwind.config.ts` の `fontSize`（`text-h1`〜`h4` / `body-lg` / `body` / `caption` / `kpi`、行間内蔵）。

---

## 1. デザインコンセプト

**「ネオングリーン × ダークUI」— ゲームの世界観を持つ実用ツール**

- ミドルシニアがワクワクできる、RPG風のインターフェース
- 暗い背景に発光するグリーンで「クエスト・成長・貢献」の世界観を表現
- 視認性を損なわず、ゲーミフィケーションの没入感を演出する

---

## 2. カラーパレット

### ブランドカラー（Tailwind カスタムトークン）

| トークン名 | 値 | 用途 |
|---|---|---|
| `--bg-dark` | `#0a0e1a` | ページ背景 |
| `--bg-panel` | `#0f1420` | ナビ・テーブルヘッダー背景 |
| `--bg-card` | `#141a2a` | カード・ヒーロー背景 |
| `--neon-green` | `#00ff88` | メインアクセント（ボタン・見出し・アイコン） |
| `--neon-green-dim` | `#00cc6a` | グラデーション終端・hover時 |
| `--neon-green-glow` | `rgba(0,255,136,0.3)` | グロー影 |
| `--neon-green-subtle` | `rgba(0,255,136,0.1)` | カード hover 背景・callout 背景 |
| `--border-line` | `rgba(0,255,136,0.2)` | 通常ボーダー |
| `--border-glow` | `rgba(0,255,136,0.4)` | hover 時ボーダー |

### テキストカラー

| トークン名 | 値 | 用途 |
|---|---|---|
| `--text-primary` | `#e0f0e8` | 本文テキスト |
| `--text-secondary` | `#a0c0b0` | サブテキスト・説明文 |
| `--text-muted` | `#708070` | メタ情報・小テキスト |

### セマンティックカラー（ワーク種別）

| 種別 | カラー | Hex |
|---|---|---|
| D. 学習 | オレンジ | `#F97316` |
| C. ギフト（コミュニティ貢献） | グリーン | `#00ff88` |
| B. 家事 | ブルー | `#3B82F6` |
| A. 有償 | ストーン | `#78716C` |
| E. その他 | ライトストーン | `#C4B5A5` |

---

## 3. 背景

ページ背景には微細なグリッドパターンを重ねる。

```css
background: #0a0e1a;
background-image:
  linear-gradient(rgba(0, 255, 136, 0.03) 1px, transparent 1px),
  linear-gradient(90deg, rgba(0, 255, 136, 0.03) 1px, transparent 1px);
background-size: 40px 40px;
```

Tailwind 実装では `globals.css` の `body` に直接記述する。

---

## 4. タイポグラフィ

### フォント

- **Noto Sans JP**（`var(--font-noto-sans-jp)`）を全体に使用
- フォールバック: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

### 可変ルート文字サイズ（読みやすさの土台）

ミドルシニアの可読性を優先し、`html` のルートを画面幅で可変にする。
タイプスケールは **rem 基準**なので、ルートが上がれば全体が連動して大きくなる。

| 画面幅 | `html` font-size |
|---|---|
| 〜768px（モバイル） | `17px` |
| 標準 | `18px` |
| 1280px〜（大画面） | `20px` |

> ⚠️ **印刷（A4ワークシート）では `16px` に固定**する（`@media print`）。
> ワークシートは 1123×794px の原寸設計のため、可変ルートで rem 文字が
> はみ出すのを防ぐ。

### スケール（`tailwind.config.ts` の `fontSize` に定義）

すべてのサイズに **行間（line-height）を内蔵**し、行間のバラつきを封じている。
標準キー（`text-xs`〜`text-5xl`）も同様に行間を持つ。

| トークン | サイズ(rem) | 行間 | ウェイト | 用途 |
|---|---|---|---|---|
| `text-display` | 2.625rem | 1.15 | 900 | ヒーロー見出し |
| `text-h1` | 2.25rem | 1.2 | 900 | ページ見出し |
| `text-h2` | 1.75rem | 1.3 | 800 | セクション見出し |
| `text-h3` | 1.375rem | 1.4 | 700 | カード見出し |
| `text-h4` | 1.125rem | 1.5 | 700 | 小見出し |
| `text-body-lg` | 1.125rem | 1.9 | 400 | 読み物本文 |
| `text-body` | 1rem | 1.75 | 400 | 標準本文 |
| `text-body-sm` | 0.875rem | 1.6 | 400 | 補足 |
| `text-caption` | 0.75rem | 1.5 | 400 | キャプション・メタ |
| `text-kpi` | 2.25rem | 1 | 900 | KPI数値（neon + glow） |

素の `<h1>`〜`<h4>` にも `globals.css` の `@layer base` で行間 1.25・
`letter-spacing 0.02em`・`font-feature-settings:"palt"` の既定が入る（サイズは
ユーティリティ/トークンで上書き可）。

**UPPERCASE ルール**: 見出し・ボタン・バッジ・ナビリンクの**欧文ラベル**は大文字表記
（`uppercase`）＋ neon 色。和文見出しには `uppercase` を掛けない（効果がなく、
`palt` 字詰めのみ効かせる）。

---

## 5. グロー・シャドウ

| 用途 | 値 |
|---|---|
| カード・ナビ通常 | `0 8px 32px rgba(0,0,0,0.4)` |
| neon-green グロー | `0 0 20px rgba(0,255,136,0.2)` |
| ボタン・アクティブ要素 | `0 0 20px rgba(0,255,136,0.3)` |
| テキスト（h1・KPI） | `0 0 20px rgba(0,255,136,0.3)` / `text-shadow` |

---

## 6. コンポーネント仕様

### カード（`components/ui/card.tsx`）

```
背景: --bg-card (#141a2a)
ボーダー: 2px solid --border-line（border-border）
ボーダー半径: 12px（rounded-xl）
パディング: 24px（CardHeader / CardContent は p-6）
影: shadow-neon（外周グロー + ドロップ）
CardTitle: text-xl / font-bold / leading-snug
```

**ホバーは opt-in**。静的な情報カードは動かさない（既定）。押せるカードだけ
`interactive` を付けると `hover:-translate-y-1` + 枠 neon + `shadow-neon-strong`。

```tsx
<Card>…</Card>              {/* 静的：ホバーで動かない */}
<Card interactive>…</Card>  {/* クリック可：ホバーで浮く */}
```

### ナビゲーション

```
背景: --bg-card
ボーダー: 2px solid --border-line, border-radius: 8px
sticky top: 20px
backdrop-filter: blur(10px)
アクティブリンク: neon-green 背景, bg-dark テキスト
hover: neon-green-subtle 背景, neon-green ボーダー, glow
```

### ボタン（`components/ui/button.tsx`）

プライマリ（`variant="default"`）:

```
背景: --neon-green (#00ff88)
テキスト: --bg-dark (#0a0e1a)  ← 必ず暗色テキスト（白は使わない）
font-weight: 600（semibold）
box-shadow: shadow-neon-glow（0 0 15px rgba(0,255,136,0.3)）
hover: bg-neon-dim (#00cc6a), shadow-neon-strong, translateY(-2px)
```

サイズ（可読性優先で従来より大きめ）:

| size | 高さ | 文字 | 用途 |
|---|---|---|---|
| `sm` | 36px（h-9） | text-sm | コンパクトUI |
| `default` | 44px（h-11） | 15px | 標準 |
| `lg` | 48px（h-12） | text-base | ヒーロー・CTA |

その他 variant: `outline`（透明+2px枠, neon文字）/ `secondary` / `ghost` /
`link`。フォーカスは `ring-2 ring-ring` + `ring-offset-bg-dark`。

⚠️ `text-white` は使わない。`#00ff88` 上の白文字はコントラスト比 約1.7:1（WCAG不合格）。
`#0a0e1a` を使うとコントラスト比 約15:1（WCAG AAA）になる。

### バッジ（pill / tag）

| 種類 | スタイル |
|---|---|
| pill（実績・ラベル） | neon-green 背景, bg-dark テキスト, font-weight 800, UPPERCASE |
| tag（カテゴリ） | neon-green-subtle 背景, neon-green テキスト, border-line ボーダー |

### Callout（強調ブロック）

```
ボーダー: 2px solid neon-green, 左ボーダー 6px
背景: neon-green-subtle
box-shadow: glow
```

### プログレスバー

```
トラック: --bg-panel, border: border-line
フィル: linear-gradient(90deg, neon-green, neon-green-dim)
box-shadow: 0 0 10px neon-green-glow
高さ: 12px, border-radius: 6px
```

### テーブル

```
border: 2px solid border-line, border-radius: 8px
thead: --bg-panel 背景, neon-green テキスト, UPPERCASE
tbody row hover: neon-green-subtle 背景
```

### アニメーション

```
ヒーロー背景: radial-gradient が pulse（4秒、opacity 0.3→0.6）
カード・ナビ hover: transition all 0.3s ease
ボタン hover: translateY(-2px), プログレスバー: width 0.5s ease
```

---

## 7. レイアウト

- **最大幅**: `1200px`、中央揃え、左右パディング `20px`
- **セクション間隔**: `40px`
- **グリッドギャップ**: `24px`

| グリッド | 通常 | 〜980px | 〜720px |
|---|---|---|---|
| cols-2 | 2カラム | 2カラム | 1カラム |
| cols-3 | 3カラム | 2カラム | 1カラム |
| cols-4 | 4カラム | 2カラム | 1カラム |

---

## 8. Tailwind / globals.css への実装マッピング

`tailwind.config.ts` に追加すべきカスタムカラー:

```ts
colors: {
  'bg-dark':   '#0a0e1a',
  'bg-panel':  '#0f1420',
  'bg-card':   '#141a2a',
  'neon': {
    DEFAULT: '#00ff88',
    dim:     '#00cc6a',
    glow:    'rgba(0,255,136,0.3)',
    subtle:  'rgba(0,255,136,0.1)',
  },
  'border-neon':      'rgba(0,255,136,0.2)',
  'border-neon-glow': 'rgba(0,255,136,0.4)',
  text: {
    primary:   '#e0f0e8',
    secondary: '#a0c0b0',
    muted:     '#708070',
  },
}
```

`globals.css` での `body`:

```css
body {
  background-color: #0a0e1a;
  background-image:
    linear-gradient(rgba(0, 255, 136, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 136, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
  color: #e0f0e8;
}
```

---

## 9. UXルール

- **hover は必ず `transition: all 0.3s ease`** — 急激な変化を避ける
- **クリック可能要素は必ず視覚フィードバック** — glow か translateY か背景色変化
- **テキストコントラスト** — neon-green on bg-dark は AA 以上を維持
- **アイコン** — 絵文字 emoji を `font-size: 36px` で表示（RPG感の演出）
- **空状態・ローディング** — neon-green のパルスアニメーションを使用

---

## 10. ライブ・スタイルガイド

`/design`（`app/design/page.tsx`）でタイプスケール・ボタン・カード・余白の
実物を一望できる。デザインシステムを詰めるときはここで確認 → 各ページへ展開する。

---

_最終更新: 2026-08-12 — タイプスケール(rem+行間内蔵)・可変ルート(16/17/18px)・
カード/ボタン刷新・`/design` スタイルガイド追加。ネオン×ダークの世界観は不変。_
