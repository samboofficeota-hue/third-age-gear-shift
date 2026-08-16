"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase/browserClient";

/**
 * 招待リンクからの初回ログイン。
 * 本人と分かっているメールアドレス宛にログイン用リンクを送るだけ（パスワード不要）。
 */
export function ActivateForm({ defaultEmail }: { defaultEmail: string }) {
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const send = async () => {
    setError(null);
    setSending(true);
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", "/workshop/guide");
    const { error } = await getSupabaseBrowserClient().auth.signInWithOtp({
      email: defaultEmail,
      options: { emailRedirectTo: callbackUrl.toString() },
    });
    setSending(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-primary/25 bg-primary/5 px-4 py-3 text-left">
        <Mail className="h-5 w-5 shrink-0 text-primary" />
        <p className="text-sm text-secondary-foreground">
          <span className="font-semibold text-foreground">{defaultEmail}</span> 宛にログイン用のリンクをお送りしました。メールを開いてリンクを押してください。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Button type="button" className="w-full" onClick={send} disabled={sending}>
        {sending ? "送信中..." : "ログイン用のリンクを送る"}
      </Button>
      <p className="text-xs text-muted-foreground">
        {defaultEmail} 宛にお送りします。パスワードは不要です。
      </p>
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
