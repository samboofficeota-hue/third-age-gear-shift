"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * 招待リンクからの初回アクティベーション・フォーム。
 * メール確認 ＋ パスワード設定 → セッション発行 → 事前アンケートへ。
 */
export function ActivateForm({
  token,
  defaultEmail,
}: {
  token: string;
  defaultEmail: string;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("パスワードは8文字以上で設定してください。");
      return;
    }
    if (password !== confirm) {
      setError("パスワード（確認）が一致しません。");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "登録に失敗しました。");
        setLoading(false);
        return;
      }
      window.location.href = "/workshop/pre/survey";
    } catch {
      setError("通信エラーが発生しました。");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-xs font-medium text-[#a0c0b0]">
          メールアドレス
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          className="w-full rounded-lg border border-[rgba(0,255,136,0.25)] bg-[#0f1420] px-3 py-2.5 text-sm text-[#e0f0e8] outline-none focus:border-primary"
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="password" className="text-xs font-medium text-[#a0c0b0]">
          パスワード（8文字以上・ご自身で設定）
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
          className="w-full rounded-lg border border-[rgba(0,255,136,0.25)] bg-[#0f1420] px-3 py-2.5 text-sm text-[#e0f0e8] outline-none focus:border-primary"
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="confirm" className="text-xs font-medium text-[#a0c0b0]">
          パスワード（確認）
        </label>
        <input
          id="confirm"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          required
          className="w-full rounded-lg border border-[rgba(0,255,136,0.25)] bg-[#0f1420] px-3 py-2.5 text-sm text-[#e0f0e8] outline-none focus:border-primary"
        />
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "登録中..." : "登録して事前アンケートに進む"}
      </Button>
    </form>
  );
}
