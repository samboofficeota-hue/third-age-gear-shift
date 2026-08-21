"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { InviteResult, InviteSummary, SessionInfo } from "../types";

/**
 * 招待作成（A-3 / T-1）。参加者を事前登録して招待URLを発行する。
 * ここでは**メールは送らない**。発行された内容を確認したうえで、
 * 「メール」タブ（P-1）から招待メールを送るという二段構えにしている。
 */

type Row = { name: string; email: string; department: string; organizationName: string };

const EMPTY_ROW: Row = { name: "", email: "", department: "", organizationName: "" };

/** 「氏名, メール, 部署, 会社名」のCSV/TSV貼り付けを行に分解する。ヘッダー行は読み飛ばす。 */
function parsePastedRows(text: string): Row[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const cols = line.split(/\t|,/).map((c) => c.trim());
      return {
        name: cols[0] ?? "",
        email: cols[1] ?? "",
        department: cols[2] ?? "",
        organizationName: cols[3] ?? "",
      };
    })
    .filter((r) => r.email && !/^(メール|email|mail)/i.test(r.email));
}

const RESULT_BADGE: Record<InviteResult["status"], { label: string; className: string }> = {
  created: { label: "新規登録", className: "bg-primary text-primary-foreground" },
  reissued: { label: "再発行", className: "bg-chart-3 text-white" },
  skipped: { label: "スキップ", className: "bg-secondary text-secondary-foreground" },
  error: { label: "エラー", className: "bg-destructive text-destructive-foreground" },
};

export function InvitePanel({
  sessions,
  selectedSessionId,
  onInvited,
  onGoToMail,
}: {
  sessions: SessionInfo[];
  selectedSessionId: string;
  onInvited: () => void;
  /** 登録後に「メール」タブへ送る（招待メール送信はそちらで行う） */
  onGoToMail: () => void;
}) {
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [targetSessionId, setTargetSessionId] = useState(selectedSessionId);
  const [row, setRow] = useState<Row>(EMPTY_ROW);
  const [pasted, setPasted] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<InviteSummary | null>(null);
  const [results, setResults] = useState<InviteResult[]>([]);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const sessionId = targetSessionId || selectedSessionId;
  const parsedRows = mode === "bulk" ? parsePastedRows(pasted) : [];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const participants = mode === "single" ? [row] : parsedRows;
    if (!sessionId) {
      setError("研修セッションを選択してください。");
      return;
    }
    if (participants.length === 0 || !participants[0].email) {
      setError("登録する参加者がいません。");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/invites", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, participants }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "登録に失敗しました。");
        return;
      }
      setSummary(data.summary);
      setResults(data.results ?? []);
      setRow(EMPTY_ROW);
      setPasted("");
      onInvited();
    } finally {
      setSubmitting(false);
    }
  };

  const copy = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 1500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="admin-page-title">招待の作成</h1>
        <p className="admin-page-note">
          参加者を事前登録し、アクティベーション用の招待URLを発行します。
          ここでは<span className="font-medium text-foreground">メールは送信されません</span>。
          内容を確認したあと「メール」タブから招待メールを送ってください。
        </p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm">登録先と入力方法</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>研修セッション</Label>
            <select
              value={sessionId}
              onChange={(e) => setTargetSessionId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {sessions.length === 0 && <option value="">（セッションがありません）</option>}
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name ?? "（名前なし）"}（{s.code}）
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={mode === "single" ? "default" : "outline"}
              onClick={() => setMode("single")}
            >
              1名ずつ
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "bulk" ? "default" : "outline"}
              onClick={() => setMode("bulk")}
            >
              まとめて貼り付け
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm">
            {mode === "single" ? "参加者情報" : "参加者リスト（CSV / スプレッドシート貼り付け）"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            {mode === "single" ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>氏名</Label>
                    <Input
                      value={row.name}
                      onChange={(e) => setRow({ ...row, name: e.target.value })}
                      placeholder="例: 太田 義史"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      メールアドレス <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="email"
                      value={row.email}
                      onChange={(e) => setRow({ ...row, email: e.target.value })}
                      placeholder="例: ota@example.co.jp"
                      autoCapitalize="none"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>会社名</Label>
                    <Input
                      value={row.organizationName}
                      onChange={(e) => setRow({ ...row, organizationName: e.target.value })}
                      placeholder="例: 株式会社COMMUNITY"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>部署名</Label>
                    <Input
                      value={row.department}
                      onChange={(e) => setRow({ ...row, department: e.target.value })}
                      placeholder="例: 経営企画部"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label>1行につき1名（氏名, メール, 部署, 会社名）</Label>
                <textarea
                  value={pasted}
                  onChange={(e) => setPasted(e.target.value)}
                  rows={8}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder={"太田 義史, ota@example.co.jp, 経営企画部, 株式会社COMMUNITY\n山田 花子, yamada@example.co.jp, 人事部, 株式会社COMMUNITY"}
                />
                <p className="text-xs text-muted-foreground">
                  カンマ区切り・タブ区切りどちらも可。ヘッダー行は自動で読み飛ばします。
                  現在 <span className="font-bold text-foreground">{parsedRows.length}</span> 名を認識しています。
                </p>
              </div>
            )}

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={submitting || !sessionId}>
              {submitting
                ? "登録中..."
                : mode === "single"
                  ? "招待を作成する"
                  : `${parsedRows.length} 名の招待を作成する`}
            </Button>
          </form>
        </CardContent>
      </Card>

      {summary && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">登録結果</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.created + summary.reissued > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-accent px-3 py-2.5">
                <p className="text-sm text-accent-foreground">
                  {summary.created + summary.reissued} 名の招待URLを発行しました。招待メールを送りましょう。
                </p>
                <Button size="sm" onClick={onGoToMail}>
                  メールタブへ
                </Button>
              </div>
            )}
            <div className="flex flex-wrap gap-3 text-sm">
              <span>依頼 {summary.requested} 件</span>
              <span className="font-medium text-primary">新規 {summary.created}</span>
              <span className="font-medium text-chart-3">再発行 {summary.reissued}</span>
              <span className="text-muted-foreground">スキップ {summary.skipped}</span>
              {summary.error > 0 && (
                <span className="font-medium text-destructive">エラー {summary.error}</span>
              )}
            </div>

            <div className="divide-y rounded-md border">
              {results.map((r, i) => {
                const badge = RESULT_BADGE[r.status];
                return (
                  <div key={`${r.email}-${i}`} className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <Badge className={`px-1.5 py-0 text-[10px] ${badge.className}`}>
                        {badge.label}
                      </Badge>
                      <span className="truncate text-sm">{r.name ?? r.email}</span>
                      <span className="truncate text-xs text-muted-foreground">{r.email}</span>
                    </div>
                    {r.reason && (
                      <p className="mt-1 text-xs text-muted-foreground">{r.reason}</p>
                    )}
                    {r.inviteUrl && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <code className="min-w-0 flex-1 truncate rounded bg-muted px-2 py-1 text-[10px]">
                          {r.inviteUrl}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 flex-shrink-0 px-2 text-[10px]"
                          onClick={() => copy(r.inviteUrl!)}
                        >
                          {copiedUrl === r.inviteUrl ? "コピー済" : "コピー"}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
