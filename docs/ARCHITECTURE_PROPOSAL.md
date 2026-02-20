# サービス構成提案書
## サードエイジへのギア・シフト ウェブアプリ

**前提：** [webapp_spec_third_age.md](webapp_spec_third_age.md) および [webapp_spec_admin_control.md](webapp_spec_admin_control.md) の技術要件に基づく。

---

## 1. 要件の整理

| 領域 | 仕様書の要件 | 備考 |
|------|--------------|------|
| フロント | React（Next.js推奨）、Tailwind + shadcn/ui、Recharts、React Flow | 対話UI・グラフ・ループ図 |
| バックエンド | Node.js + Express or **Next.js API Routes**、PostgreSQL、JWT | 1コードベースで揃えたい |
| リアルタイム | WebSocket（Socket.io） | ブロック開放の一斉配信・進捗反映 |
| AI | Claude API（claude-sonnet-4-6） | 対話・コメント・PDF用サマリー |
| PDF | puppeteer or react-pdf、A4縦・約10ページ | 経営計画書の出力 |
| 認証 | JWT、role: admin \| facilitator \| participant | 管理者・ファシリ・受講生の分離 |

---

## 2. 提案するサービス構成（全体像）

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          クライアント（ブラウザ）                          │
│  受講生アプリ（/）  │  管理者ダッシュボード（/admin）  │  共通：認証・WS接続   │
└─────────────────────────────────────────────────────────────────────────┘
                    │                              │
                    │ HTTPS                        │ WebSocket (Socket.io)
                    ▼                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     Next.js アプリケーション（1プロセス）                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ App Router   │  │ API Routes   │  │ Socket.io    │  │ PDF生成      │  │
│  │ (React UI)   │  │ (REST API)   │  │ サーバー      │  │ (react-pdf)  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                    │                              │
                    │ 永続化・セッション            │ ブロック状態・進捗
                    ▼                              ▼
┌─────────────────────────────┐    ┌─────────────────────────────┐
│      PostgreSQL              │    │  （同一プロセス内メモリ or   │
│  ・users / sessions          │    │   Redis オプション）        │
│  ・workshop_data (JSONB等)   │    │   Socket.io アダプター用     │
│  ・block_status              │    └─────────────────────────────┘
│  ・participant_block_override │
└─────────────────────────────┘
                    │
                    │  Server-side のみ
                    ▼
┌─────────────────────────────┐
│      Claude API              │
│  （Anthropic SDK / 環境変数） │
└─────────────────────────────┘
```

**方針：** フロント・API・WebSocket・PDF を **1つの Next.js プロセス** にまとめ、カスタムサーバーで Next.js と Socket.io を同居させる。DB は PostgreSQL のみで完結させる。

---

## 3. 技術スタック（具体案）

| レイヤー | 採用技術 | 理由 |
|----------|----------|------|
| **フレームワーク** | Next.js 14+ (App Router) | 仕様「Next.js推奨」。SSR/API/同一リポジトリで開発しやすい。 |
| **UI** | Tailwind CSS + shadcn/ui | 仕様どおり。アクセシビリティ・一貫性。 |
| **グラフ** | Recharts | 円グラフ・ガント風タイムライン。 |
| **ループ図** | React Flow | 仕様どおり。ノード・矢印の編集に適する。 |
| **ORM / DB** | Prisma + PostgreSQL | 型安全・マイグレーション・JSONB 対応。 |
| **認証** | JWT（httpOnly cookie）+ 自前 or NextAuth.js | role をクレームに含め、API/WS で検証。 |
| **API** | Next.js Route Handlers (App Router) | `/app/api/...` で REST を実装。 |
| **リアルタイム** | Socket.io | 仕様どおり。カスタムサーバーで Next と同一プロセスに。 |
| **AI** | Anthropic SDK (Claude) | 対話・コメント・サマリーをサーバーからのみ呼び出し。 |
| **PDF** | @react-pdf/renderer | サーバーでレンダリング可能。puppeteer より軽量・デプロイしやすい。 |
| **フォント** | Noto Sans JP | 仕様どおり。 |

---

## 4. リアルタイム（WebSocket）の扱い

- **Next.js 単体（Vercel 等の serverless）** では Socket.io を動かせないため、**Node 上で Next を「カスタムサーバー」として動かし、その同じプロセスで Socket.io を起動**する構成を推奨する。
- 運用イメージ：
  - `node server.js`（または `npm run start`）で 1 プロセス起動
  - その中で `next` の HTTP ハンドラと Socket.io を同じポート（例: 3000）にマウント
- こうすると Vercel にはデプロイできず、**VPS・Railway・Render・自前 Docker など「常時起動の Node サーバー」** が前提になる。
- **Vercel にフロント＋API を載せたい場合**は、Socket.io 用に **別の小さな Node サービス**（例: Express + Socket.io のみ）を 1 つ用意し、ブロック状態は DB または Redis で共有する構成も可能（その場合は「構成 B」として別案にまとめる）。

---

## 5. ディレクトリ構成案

```
third-age-gear-shift/
├── app/                          # Next.js App Router
│   ├── (auth)/                    # 認証レイヤー（ログイン等）
│   │   └── login/
│   ├── (participant)/             # 受講生向け
│   │   └── workshop/              # Block 0〜8 の画面
│   │       ├── block-0/
│   │       ├── block-1/
│   │       └── ...
│   ├── admin/                     # 管理者・ファシリ向け
│   │   ├── dashboard/
│   │   └── sessions/
│   ├── api/                       # REST API
│   │   ├── auth/
│   │   ├── workshop/              # 入力保存・取得
│   │   ├── michi/                 # Claude 対話
│   │   ├── blocks/                # ブロック開放 API（admin/facilitator）
│   │   └── pdf/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                        # shadcn
│   ├── workshop/                  # ブロック共通・グラフ・ループ図
│   └── michi/                     # ミッチー対話 UI
├── lib/
│   ├── db/                        # Prisma client
│   ├── auth/                      # JWT 検証・role チェック
│   ├── michi/                     # プロンプト組み立て・Claude 呼び出し
│   ├── pdf/                       # 経営計画書 PDF テンプレート
│   └── socket/                    # Socket.io クライアント用ユーティリティ
├── server/                        # カスタムサーバー（Next + Socket.io）
│   └── index.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── docs/                          # 既存の仕様書
├── public/
├── package.json
├── next.config.js
└── README.md
```

---

## 6. 主要なデータフロー

| 機能 | フロー概要 |
|------|------------|
| **ログイン** | メール/パスワード → API で検証 → JWT 発行（httpOnly cookie）→ 以降の API/WS で JWT 検証。 |
| **ブロック開放** | 管理者が「開放」→ API で `block_status` 更新 → 同一プロセス内 Socket.io で `block:opened` を全クライアントに配信 → 受講生 UI が該当ブロックを表示。 |
| **進捗反映** | 受講生がブロック完了 → API で完了フラグ保存 → 必要に応じて Socket で `progress` を送信 → 管理者ダッシュボードが「〇/〇名完了」を更新。 |
| **ミッチー対話** | フロントからテキスト送信 → API `/api/michi` でブロック別プロンプト＋ユーザーコンテキストを組み立て → Claude 呼び出し → 返答を JSON で返す。 |
| **PDF 出力** | 全 STEP データ取得 → サーバーで @react-pdf/renderer により PDF 生成 → ストリームでダウンロード（または一時 URL）。 |

---

## 7. デプロイの選択肢

| 方式 | 対象 | メリット | 注意 |
|------|------|----------|------|
| **A. 単一 Node サーバー** | VPS、Railway、Render、Docker | 実装が単純。Next + Socket.io が 1 プロセスで完結。 | Vercel は不可。 |
| **B. Vercel + Socket 用サービス** | Vercel（Next）+ 別サービス（Socket.io） | フロント・API は Vercel の利点を活かせる。 | ブロック状態を DB/Redis で共有する必要あり。 |
| **C. ポーリングで代替** | どこでも | WebSocket をやめ、5〜10 秒ごとにブロック状態 API を叩く。 | リアルタイム性は落ちるが、構成は最もシンプル。 |

**推奨：** まずは **構成 A（単一 Node サーバー）** で開発し、研修会場や社内環境で 1 台サーバーを立てる運用を想定する。必要になったら B や C に切り替え可能。

---

## 8. 環境変数（イメージ）

```env
# DB
DATABASE_URL="postgresql://..."

# JWT
JWT_SECRET="..."
JWT_COOKIE_NAME="third_age_session"

# Claude
ANTHROPIC_API_KEY="..."

# 本番
NEXT_PUBLIC_APP_URL="https://..."
```

---

## 9. 次のステップ

1. 上記スタックで **Next.js プロジェクトの初期化**（Tailwind, shadcn, Prisma の導入）
2. **Prisma スキーマの定義**（users, sessions, workshop_data, block_status, participant_block_override）
3. **カスタムサーバー** の実装（Next + Socket.io の同居）
4. 認証（ログイン・JWT・role）の実装
5. Block 0 から順に UI と API を実装

この構成案で進めてよければ、リポジトリ上で「初期プロジェクト作成」から具体的なコマンドとファイル案を出します。

---

*本提案は仕様書 v1.0 / 管理者追補 v1.1 に基づく。開発フェーズで調整可。*
