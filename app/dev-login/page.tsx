"use client";

// 開発環境専用のログイン補助画面。
// Claude Codeのプレビュー等、実メールを受信できないブラウザから確認作業を
// 進めるために、事前登録済みメールアドレスでその場にセッションを張る。
// 本番では /api/dev-login が404を返すため機能しない。

import { useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/browserClient";

function roleDefaultPath(role: string): string {
  if (role === "admin" || role === "facilitator") return "/admin";
  return "/workshop";
}

export default function DevLoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    setStatus("トークンを発行しています...");
    try {
      const res = await fetch("/api/dev-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(`エラー: ${data.error ?? res.status}`);
        setLoading(false);
        return;
      }

      setStatus("セッションを確立しています...");
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.verifyOtp({
        token_hash: data.tokenHash,
        type: data.verifyType,
      });
      if (error) {
        setStatus(`verifyOtp エラー: ${error.message}`);
        setLoading(false);
        return;
      }

      setStatus("紐付けしています...");
      const linkRes = await fetch("/api/auth/link", { method: "POST", credentials: "include" });
      const linkData = await linkRes.json().catch(() => ({}));
      if (!linkRes.ok) {
        setStatus(`/api/auth/link エラー: ${JSON.stringify(linkData)}`);
        setLoading(false);
        return;
      }

      setStatus(`ログイン成功: ${linkData.user?.email} (${linkData.user?.role})。移動します...`);
      window.location.href = roleDefaultPath(linkData.user?.role ?? "participant");
    } catch (e) {
      setStatus(`例外: ${e instanceof Error ? e.message : String(e)}`);
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif", color: "#eee", background: "#111", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 18, fontWeight: "bold" }}>開発用ログイン(dev-login)</h1>
      <p style={{ fontSize: 13, color: "#999", marginTop: 4 }}>
        本番では動作しません。事前登録済みのメールアドレスのみ使えます。
      </p>
      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="登録済みメールアドレス"
          style={{ width: 320, padding: 8, color: "#000" }}
        />
        <button onClick={run} disabled={loading || !email.trim()} style={{ padding: "8px 16px" }}>
          {loading ? "処理中..." : "ログイン"}
        </button>
      </div>
      {status && <p style={{ marginTop: 16, whiteSpace: "pre-wrap" }}>{status}</p>}
      <p style={{ marginTop: 24 }}>
        <Link href="/" style={{ color: "#6cf" }}>
          トップへ
        </Link>
      </p>
    </div>
  );
}
