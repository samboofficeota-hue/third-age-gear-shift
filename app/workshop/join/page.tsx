"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BRAND } from "@/lib/brand";
import { BrandMark } from "@/components/BrandMark";

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // すでに session に参加済みなら block-0 へスキップ
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      setChecking(false);
      if (!data?.user) {
        router.replace("/login");
        return;
      }
      // WorkshopData に sessionId があれば参加済み
      const wd = await fetch("/api/workshop/me", { credentials: "include" })
        .then((r) => r.json())
        .catch(() => ({}));
      if (wd?.workshopData?.sessionId) {
        router.replace("/workshop");
      }
    })();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/workshop/join", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "コードの確認に失敗しました。");
      return;
    }

    router.push("/workshop");
    router.refresh();
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">確認中...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <BrandMark className="mx-auto mb-4 h-14 w-14" />
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {BRAND.name}
        </h1>
        <p className="subtitle mt-1">{BRAND.tagline}</p>
      </div>

      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="space-y-1 pb-4 text-center">
          <CardTitle className="text-xl">研修コードの入力</CardTitle>
          <CardDescription>講師からお渡しした共通コードを入力してください</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">研修コード</Label>
              <Input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="font-mono tracking-widest"
                placeholder="例: 3rdage0201"
                autoComplete="off"
                autoCapitalize="none"
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
              {loading ? "確認中..." : "研修に参加する"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              コードは講師から提供されます。お手元にない場合は研修事務局までお問い合わせください。
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
