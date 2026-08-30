"use client";

// /auth/callback
// マジックリンクのリンク先。
//
// 認可コードの交換は「ブラウザ側」で行う。PKCE の code verifier は
// signInWithOtp を実行したブラウザにしか無いため、サーバールートで
// exchangeCodeForSession すると「code verifier not found」で失敗する。
// ブラウザで交換すると createBrowserClient がセッションを Cookie に書き込むので、
// そのあとフルリロードで遷移すれば、サーバー側（middleware/getSession）も同じ Cookie を読める。

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browserClient";
import { safeRedirectPath } from "@/lib/safeRedirect";

function roleDefaultPath(role: string): string {
  if (role === "admin") return "/admin";
  return "/workshop";
}

export default function AuthCallbackPage() {
  const [message, setMessage] = useState("少しお待ちください。自動でログインします。");

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const url = new URL(window.location.href);
      const next = safeRedirectPath(url.searchParams.get("next"));

      const authError =
        url.searchParams.get("error_description") ?? url.searchParams.get("error");
      if (authError) {
        window.location.replace(`/login?error=${encodeURIComponent(authError)}`);
        return;
      }

      const code = url.searchParams.get("code");
      if (!code) {
        window.location.replace("/login?error=missing_code");
        return;
      }

      try {
        const supabase = getSupabaseBrowserClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;
        if (error) {
          window.location.replace(`/login?error=${encodeURIComponent(error.message)}`);
          return;
        }

        // セッションはCookieに入った。サーバー側でpublic.usersと紐付ける。
        const res = await fetch("/api/auth/link", { method: "POST", credentials: "include" });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          window.location.replace(`/login?error=${encodeURIComponent(data.error ?? "link_failed")}`);
          return;
        }

        // フルリロードでサーバー側（middleware/getSession）にも反映させる。
        window.location.replace(next ?? roleDefaultPath(data.user?.role ?? "participant"));
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "ログインを完了できませんでした。";
        setMessage(msg);
        window.location.replace(`/login?error=${encodeURIComponent(msg)}`);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center">
        <div className="text-4xl" aria-hidden>
          🔑
        </div>
        <h1 className="mt-4 text-xl font-bold text-foreground">ログインしています…</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
