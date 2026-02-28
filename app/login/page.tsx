"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function roleDefaultPath(role: string): string {
  if (role === "admin" || role === "facilitator") return "/admin";
  return "/workshop/block-0";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      setCheckingSession(false);
      if (data?.user) {
        router.replace(from ?? roleDefaultPath(data.user.role));
      }
    })();
  }, [from, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "ログインに失敗しました。");
      return;
    }
    window.location.href = from ?? roleDefaultPath(data.user?.role ?? "participant");
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <p className="text-sm text-muted-foreground">確認中...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-2xl text-primary-foreground shadow-md">
          ⚙️
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">
          サードエイジへのギア・シフト
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ミドルシニア向け 2日間ワークショップ
        </p>
      </div>

      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-xl">ログイン</CardTitle>
          <CardDescription>メールアドレスとパスワードを入力してください</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "ログイン中..." : "ログインしてはじめる"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              アカウントをお持ちでない方は{" "}
              <Link href="/register" className="font-medium text-primary hover:underline">
                新規登録
              </Link>
            </p>
            <Link href="/" className="text-center text-xs text-muted-foreground hover:text-foreground">
              トップへ戻る
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-stone-50">
          <p className="text-sm text-muted-foreground">読み込み中...</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
