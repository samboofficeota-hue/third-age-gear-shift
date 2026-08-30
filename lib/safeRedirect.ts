/**
 * ログイン後の行き先（`?from=` / `?next=`）を、同一サイト内に限定する。
 *
 * これらのクエリは誰でも自由に付けられる。検証せずに router.replace() へ渡すと、
 * Next.js の App Router が外部オリジンを検知して window.location.replace() に切り替えるため、
 * **正規ドメインのURLから任意の外部サイトへ飛ばせる**（オープンリダイレクト＝フィッシングの踏み台）。
 *
 * 判定はブラウザの URL パーサに任せる。`//evil.example`（プロトコル相対）や
 * `javascript:` は origin が現在のオリジンと一致しないため、まとめて弾ける。
 *
 * クライアント専用（window を参照する）。
 */
export function safeRedirectPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
