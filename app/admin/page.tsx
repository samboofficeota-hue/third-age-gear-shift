"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, MapPin, Plus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SessionForm } from "./_components/SessionForm";
import { formatDate, type SessionInfo } from "./types";

/**
 * 管理ダッシュボードの入口。研修（セッション）をカードで並べる。
 *
 * ここは「どの研修の話をするか」を選ぶだけの画面にする。
 * 個々の操作（受講生・進行・メール・講師画面）は
 * /admin/sessions/[id] 配下に置き、常に1つの研修の文脈で行う。
 */
export default function AdminIndexPage() {
  const [role, setRole] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const isAdmin = role === "admin";

  const load = useCallback(async () => {
    const [meRes, sRes] = await Promise.all([
      fetch("/api/auth/me", { credentials: "include" }),
      fetch("/api/admin/sessions", { credentials: "include" }),
    ]);
    if (sRes.status === 401 || sRes.status === 403) {
      window.location.href = "/login?from=/admin";
      return;
    }
    const [meData, sData] = await Promise.all([
      meRes.json().catch(() => ({})),
      sRes.json(),
    ]);
    setRole(meData.user?.role ?? null);
    setSessions(sData.sessions ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load().catch(() => {
      setError("データの取得に失敗しました。");
      setLoading(false);
    });
  }, [load]);

  if (loading)
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      </div>
    );
  if (error)
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="admin-page-title">研修一覧</h1>
          <p className="admin-page-note">
            管理する研修を選んでください。
            {!isAdmin && "（担当している研修のみ表示されます）"}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreating((v) => !v)} variant={creating ? "outline" : "default"}>
            {creating ? (
              "閉じる"
            ) : (
              <>
                <Plus className="mr-1.5 h-4 w-4" />
                研修を作成
              </>
            )}
          </Button>
        )}
      </div>

      {creating && isAdmin && (
        <div className="mt-6">
          <SessionForm
            onSaved={(s) => {
              setSessions((prev) => [s, ...prev]);
              setCreating(false);
            }}
            onCancel={() => setCreating(false)}
          />
        </div>
      )}

      {sessions.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          {isAdmin
            ? "研修がまだありません。「研修を作成」から追加してください。"
            : "担当している研修がありません。事務局にお問い合わせください。"}
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {sessions.map((s) => (
            <Link
              key={s.id}
              href={`/admin/sessions/${s.id}`}
              className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary hover:bg-accent"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-base font-bold text-foreground">
                    {s.name ?? "（名前なし）"}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">{s.code}</p>
                </div>
                {!s.isActive && (
                  <Badge variant="secondary" className="flex-shrink-0">
                    終了
                  </Badge>
                )}
              </div>

              <dl className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 flex-shrink-0" />
                  <span>
                    {s.day1Date || s.day2Date
                      ? `${formatDate(s.day1Date)} ／ ${formatDate(s.day2Date)}`
                      : "日程未定"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">
                    {s.isOnline ? "オンライン" : "対面"}
                    {s.location ? ` · ${s.location}` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 flex-shrink-0" />
                  <span>
                    受講生 {s.participantCount} 名
                  </span>
                </div>
              </dl>

              <p className="mt-4 text-sm font-medium text-primary">
                この研修を管理する →
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
