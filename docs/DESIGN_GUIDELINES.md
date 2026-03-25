# デザインガイドライン

じぶん経営研究所 Webアプリのデザイン仕様書。
モックアップ（`common.css` / `index.html`）のテイストをベースに、Next.js + Tailwind CSS + shadcn/ui 実装へ翻訳したルール集。

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

### スケール

| 要素 | サイズ | ウェイト | その他 |
|---|---|---|---|
| ページタイトル（h1） | `42px` / `text-4xl` | 900 | UPPERCASE, letter-spacing 0.05em, neon-green, glow shadow |
| セクション見出し（h2） | `28px` / `text-2xl` | 800 | UPPERCASE, letter-spacing 0.05em, 左に neon-green 4px ボーダー |
| カード見出し（h3） | `20px` / `text-xl` | 700 | UPPERCASE, letter-spacing 0.03em, neon-green |
| 本文 | `16px` / `text-base` | 400 | line-height 1.7–1.8, `--text-secondary` |
| 小テキスト | `12–13px` / `text-xs` | 400 | `--text-muted` |
| KPI数値 | `36px` / `text-4xl` | 900 | neon-green, glow shadow |
| ナビリンク | `14px` / `text-sm` | 600 | UPPERCASE, letter-spacing 0.5px |

**UPPERCASE ルール**: 見出し・ボタン・バッジ・ナビリンクはすべて大文字表記（`text-transform: uppercase`）。

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

### カード

```
背景: --bg-card (#141a2a)
ボーダー: 2px solid --border-line
ボーダー半径: 8px
パディング: 24px
トップボーダーライン: hover時に linear-gradient(90deg, transparent, neon-green, transparent) が出現
hover: translateY(-4px), border-color → neon-green, glow shadow
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

### ボタン（プライマリ）

```
背景: --neon-green (#00ff88)
テキスト: --bg-dark (#0a0e1a)  ← 必ず暗色テキスト（白は使わない）
font-weight: 700〜800
box-shadow: 0 0 20px rgba(0,255,136,0.3)
hover: --neon-green-dim (#00cc6a), glow 強化
```

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

_最終更新: 2026-03-25_
