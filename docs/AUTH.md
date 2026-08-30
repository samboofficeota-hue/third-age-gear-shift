# 認証

> このドキュメントは 2026-08-27 に実装に合わせて全面改訂した。
> それ以前の版は「メール＋パスワード／自前JWT（`third_age_session` Cookie）／Railway でシード」
> と書かれていたが、いずれも**現在は使っていない**。Supabase Auth のマジックリンクに移行済み。

## 概要

- **ログイン:** パスワードなし。**マジックリンク**（Supabase Auth の `signInWithOtp`）
- **セッション:** Supabase Auth が管理（`@supabase/ssr` の Cookie）。自前のJWTは持たない
- **ロール:** `admin` | `participant` の2層。運営（事務局・当日の進行役）はすべて `admin`
- **アカウント発行:** 招待制。事務局が管理画面から事前登録する

`JWT_SECRET` / `JWT_COOKIE_NAME` は旧方式の名残で、**コードから参照されていない**。

## ロールの持ち方（重要）

role は2か所にある。**DBが正で、`app_metadata` はキャッシュ**という関係を守ること。

| 置き場所 | 用途 | 更新されるタイミング |
|---|---|---|
| `public.users.role`（Prisma） | **正** | 事務局がDBを変更したとき |
| Supabase `auth.users.app_metadata.role` | 高速判定用のキャッシュ | 本人がログインしたとき（`syncAuthMetadata`） |

`app_metadata` は **service role でしか書けない**領域なので、利用者が自分で書き換えることはできない。
middleware（Edge 実行で Prisma を呼べない）はこのキャッシュを見てページを振り分ける。

ただし**キャッシュは本人が再ログインするまで古いまま**になる。離任などで role を落としても、
既存セッションは admin のまま通ってしまうため、実データに触る層では必ずDBを引き直す。

- `lib/adminAuth.ts` の `isAdminInDb(userId)` がその判定
- `requireAdmin()`（`/api/admin/*` の共通ガード）が毎回これを通す
- `/view` は API を介さずサーバー側で直接 Prisma を引く画面なので、
  `app/view/[sessionId]/_lib.ts` でも同じ判定を通す

> middleware は**入口の振り分け**であって権限の最終判断ではない。
> 新しく管理系の画面やAPIを足すときは、必ず `requireAdmin()` か `isAdminInDb()` を通すこと。

## ログインの流れ

```
/login （メールを入力）
  ↓ POST /api/auth/check-email     … 事前登録済みかを確認（※後述の注意あり）
  ↓ supabase.auth.signInWithOtp()  … マジックリンクを送信
  ↓ （メールのリンクを開く）
/auth/callback
  ↓ exchangeCodeForSession()       … Supabase セッションを確立
  ↓ POST /api/auth/link            … public.users と紐付け、role を app_metadata に同期
  ↓ next（同一サイト内のみ）または role の既定ページへ
```

### リダイレクト先の扱い

`?from=` / `?next=` は誰でも自由に付けられる。検証せずに `router.replace()` へ渡すと、
Next.js の App Router が外部オリジンを検知して `window.location.replace()` に切り替えるため、
**正規ドメインのURLから任意の外部サイトへ飛ばせてしまう**（オープンリダイレクト）。

`lib/safeRedirect.ts` の `safeRedirectPath()` を必ず通す。同一オリジン以外は `null` を返し、
`//evil.example`（プロトコル相対）や `javascript:` もまとめて弾く。

> 2026-08-27 まで `/login` の `router.replace(from)` だけがこの検証を通していなかった（同日修正）。
> 行き先をクエリから受け取る箇所を新設するときは、この関数を通すこと。

## アカウント作成

事務局が管理画面（`/admin/sessions/[id]` の受講生タブ）から事前登録する。
`inviteToken` は `randomBytes(24).toString("base64url")`（192ビットのCSPRNG）で、有効期限は14日。

### ⚠️ 招待制のゲートはブラウザ側にしかない（既知の課題）

`/login`・`/register` は `/api/auth/check-email` で事前登録済みかを確認してから
`signInWithOtp` を呼ぶが、**これはクライアント側の分岐にすぎない**。

`NEXT_PUBLIC_SUPABASE_ANON_KEY` はブラウザバンドルに含まれる公開値なので、攻撃者は
Supabase の認証エンドポイントを直接叩ける。自分のアドレスに届いたリンクを踏むと、
`lib/auth.ts` の `linkOrCreateUserForAuthId` が「該当行が無ければ新規作成」する分岐で
`public.users` に行を作り、招待されていない第三者が participant として成立してしまう。

成立可否は Supabase 側の **Allow new users to sign up** 設定に依存する。無効なら現状は塞がっているが、
**コード側に歯止めが無い**状態は変わらない。塞ぐなら:

1. `/api/auth/link` で「既存の `public.users` 行が無ければ作らずに 401」に変える
   （アカウント作成は招待フロー限定にする）
2. Supabase の公開サインアップを無効化する
3. クライアントの `signInWithOtp` に `shouldCreateUser: false` を渡す（多層防御。単独では不十分）

あわせて `/api/auth/check-email` は、未認証で「そのメールが受講登録されているか」を答える
**在籍オラクル**になっている。1 を実施するなら、登録済みかどうかで応答を変えず、
常に「リンクを送りました」と表示する形に寄せるのが望ましい。

## ルート保護

`middleware.ts` の matcher は `/workshop/*` `/admin/*` `/view/*` `/login`。
**`/api/*` は middleware を通らない**ので、各ルートが自分で `getSession()` / `requireAdmin()` を呼ぶ。

- **/workshop/\*** … ログイン必須。未ログインは `/login?from=...` へ
- **/admin/\*** および **/view/\*** … `admin` のみ。それ以外は `/` へ
- **/login** … 認証不要

セッションの検証には `supabase.auth.getUser()` を使う（`getSession()` はローカル検証のみで偽装可能）。

## API

| エンドポイント | 説明 |
|----------------|------|
| `POST /api/auth/check-email` | 事前登録済みかを返す。未認証で呼べる（上記の注意を参照） |
| `POST /api/auth/link` | Supabase セッションを `public.users` と紐付け、role を `app_metadata` に同期 |
| `POST /api/auth/logout` | サインアウト |
| `GET /api/auth/me` | 現在のユーザー。未ログインは `{ user: null }` |
| `POST /api/dev-login` | **開発専用**。実行時に `NODE_ENV === "production"` なら 404 |

`/api/workshop/me/*` はすべて `getSession()` の `sub` のみを主語にする。
**リクエスト由来の userId を受け取ってはいけない**（他人のデータに触れる経路を作らないため）。

## 環境変数

| 変数 | 説明 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | ブラウザに出てよい。CSP の `connect-src` にも使う |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ブラウザに出てよい（**公開値**。これを持つだけでは何もできない前提で設計する） |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | **秘密**。サーバー専用モジュールからのみ参照する |

`SUPABASE_SERVICE_ROLE_KEY` を参照してよいのは `lib/supabase/adminClient.ts` と
`lib/supabaseStorage.ts` だけ。`"use client"` 側から辿れるモジュールに import しないこと。

## 関連

- ロールとRLSの関係: [DATABASE.md](DATABASE.md)（公開テーブルは必ず RLS を有効化する）
- 運用手順: [ADMIN_WORKFLOW.md](ADMIN_WORKFLOW.md)
