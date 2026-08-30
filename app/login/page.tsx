"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthBrandHeader } from "@/components/AuthBrandHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getSupabaseBrowserClient } from "@/lib/supabase/browserClient";
import { safeRedirectPath } from "@/lib/safeRedirect";

function roleDefaultPath(role: string): string {
  if (role === "admin") return "/admin";
  return "/workshop";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(searchParams.get("error"));
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      setCheckingSession(false);
      if (data?.user) {
        // from は誰でも付けられるので、同一サイト内に限定する（オープンリダイレクト防止）
        router.replace(safeRedirectPath(from) ?? roleDefaultPath(data.user.role));
      }
    })();
  }, [from, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSending(true);

    // 「登録済みか」をここで確認して出し分けない。未認証で誰でも叩ける画面なので、
    // 応答を変えると「そのアドレスがこの研修の受講者か」を外部から確認できてしまう
    // （本人の雇用状況に関わる情報）。登録の有無にかかわらず同じ画面を出し、
    // 実際に入れるかどうかは /api/auth/link がサーバー側で判定する。
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    const safeFrom = safeRedirectPath(from);
    if (safeFrom) callbackUrl.searchParams.set("next", safeFrom);
    const { error } = await getSupabaseBrowserClient().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: callbackUrl.toString() },
    });
    setSending(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent">
        <p className="text-sm text-muted-foreground">確認中...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-transparent px-4 pt-10">
      <AuthBrandHeader className="mb-8" />

      <Card className="w-full max-w-md shadow-lg">
        {sent ? (
          <>
            <CardHeader className="items-center p-5 pb-2 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
                <Mail className="h-6 w-6 text-primary" />
              </span>
              <CardTitle className="mt-2 text-xl">メールをお送りしました</CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 text-center">
              <p className="text-sm text-secondary-foreground">
                <span className="font-semibold text-foreground">{email}</span>{" "}
                が登録されていれば、ログイン用のリンクをお送りしています。メールを開いて、リンクを押してください。
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                届かないときは、迷惑メールフォルダもご確認ください。リンクには有効期限があります。
                入力したアドレスに心当たりがない場合や、しばらく待っても届かない場合は、事務局までお問い合わせください。
              </p>
            </CardContent>
            <CardFooter className="flex flex-col gap-1.5 p-5 pt-1">
              <button
                type="button"
                onClick={() => setSent(false)}
                className="mt-3 text-center text-xs font-medium text-primary hover:underline"
              >
                別のメールアドレスで送り直す
              </button>
              <Link href="/" className="text-center text-xs text-muted-foreground hover:text-foreground">
                トップへ戻る
              </Link>
            </CardFooter>
          </>
        ) : (
          <>
            <CardHeader className="p-5 pb-2 text-center">
              <CardTitle className="whitespace-nowrap text-xl">おかえりなさい。続きを始めましょう</CardTitle>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-2 p-5 pt-0">
                <div className="space-y-1">
                  <Label htmlFor="email">メールアドレス</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="登録されたメールアドレスを入力ください"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  パスワードは不要です。ログイン用のリンクをメールでお送りします。
                </p>
                {error && (
                  <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                    {error}
                  </p>
                )}
              </CardContent>

              <CardFooter className="flex flex-col gap-1.5 p-5 pt-1">
                <Button type="submit" disabled={sending || email.trim() === ""}>
                  {sending ? "送信中..." : "ログイン用のリンクを送る"}
                </Button>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  アカウントをお持ちでない方は{" "}
                  <Link href="/register" className="font-medium text-primary hover:underline">
                    新規登録ページへ
                  </Link>
                </p>
                <Link href="/" className="text-center text-xs text-muted-foreground hover:text-foreground">
                  トップへ戻る
                </Link>
              </CardFooter>
            </form>
          </>
        )}
      </Card>

      <SiteFooter className="mt-4" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-transparent">
          <p className="text-sm text-muted-foreground">読み込み中...</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
