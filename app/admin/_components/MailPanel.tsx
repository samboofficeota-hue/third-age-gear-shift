"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TEMPLATE_LABEL,
  formatTime,
  type EmailLogRow,
  type EmailTemplateKey,
  type MailConfig,
  type MailSendResult,
  type MailSendSummary,
  type Participant,
} from "../types";

/**
 * メール送信（P-1 / M-1）。
 *
 * 事故を防ぐための順番を画面で固定する：
 *   ① テンプレートを選ぶ → ② 宛先を選ぶ（既定の絞り込み付き）→
 *   ③ 実際の宛先で本文をプレビュー → ④ 確認してから送信
 * 送った結果は履歴に残り、失敗した相手だけ選び直して再送できる。
 */

type TemplateDef = {
  key: EmailTemplateKey;
  note: string;
  /** そのテンプレートを送る対象の既定条件 */
  match: (p: Participant) => boolean;
  matchLabel: string;
};

const TEMPLATES: TemplateDef[] = [
  {
    key: "invite",
    note: "アカウント登録用の招待URLを送ります。招待タブで登録済みの方が対象です。",
    match: (p) => p.inviteStatus !== "activated",
    matchLabel: "まだ有効化していない人",
  },
  {
    key: "reminder_pre",
    note: "事前アンケート・じぶん紹介が未提出の方に、提出をお願いします。",
    match: (p) => p.inviteStatus === "activated" && !(p.preSurveyDone && p.profileSlideDone),
    matchLabel: "事前課題が未提出の人",
  },
  {
    key: "completion",
    note: "Day2を終えた方に、書いたものを見返してもらう案内を送ります。",
    match: (p) => Boolean(p.completedAt),
    matchLabel: "修了した人",
  },
  {
    key: "followup_3m",
    note: "3ヶ月後のふりかえり（§F）への回答をお願いします。",
    match: (p) => Boolean(p.completedAt),
    matchLabel: "修了した人",
  },
];

const RESULT_BADGE: Record<MailSendResult["status"], { label: string; className: string }> = {
  sent: { label: "送信", className: "bg-primary text-primary-foreground" },
  failed: { label: "失敗", className: "bg-destructive text-destructive-foreground" },
  skipped: { label: "スキップ", className: "bg-secondary text-secondary-foreground" },
};

export function MailPanel({
  participants,
  sessionId,
  sessionName,
}: {
  participants: Participant[];
  sessionId: string;
  sessionName: string;
}) {
  const [template, setTemplate] = useState<EmailTemplateKey>("invite");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [config, setConfig] = useState<MailConfig | null>(null);
  const [logs, setLogs] = useState<EmailLogRow[]>([]);
  const [preview, setPreview] = useState<{
    subject: string;
    html: string;
    to?: string;
    sample: boolean;
    blockedReason?: string;
  } | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [sending, setSending] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [testing, setTesting] = useState(false);
  const [testDone, setTestDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<MailSendSummary | null>(null);
  const [results, setResults] = useState<MailSendResult[]>([]);

  const def = TEMPLATES.find((t) => t.key === template)!;
  const matched = useMemo(
    () => participants.filter(def.match),
    [participants, def]
  );

  const loadLogs = useCallback(async () => {
    if (!sessionId) return;
    const res = await fetch(`/api/admin/emails?sessionId=${sessionId}`, {
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setConfig(data.config ?? null);
      setLogs(data.logs ?? []);
    }
  }, [sessionId]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // テンプレートを変えたら、そのテンプレートの既定対象を選び直す
  useEffect(() => {
    setSelected(new Set(matched.map((p) => p.id)));
    setPreview(null);
    setSummary(null);
    setResults([]);
    setError(null);
    // matched はテンプレート・受講生が変わったときだけ変わる
  }, [matched]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const runPreview = async () => {
    setPreviewing(true);
    setError(null);
    try {
      // 選択中の先頭1名の実データで描画する（誰にも選んでいなければサンプル）
      const firstId = participants.find((p) => selected.has(p.id))?.id ?? null;
      const res = await fetch("/api/admin/emails/preview", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template, sessionId, userId: firstId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "プレビューの取得に失敗しました。");
        return;
      }
      setConfig(data.config ?? config);
      setPreview({
        subject: data.subject,
        html: data.html,
        to: data.to,
        sample: Boolean(data.sample),
        blockedReason: data.blockedReason,
      });
    } finally {
      setPreviewing(false);
    }
  };

  const sendTest = async () => {
    const to = testTo.trim();
    if (!to) {
      setError("テスト送信先を入力してください。");
      return;
    }
    setTesting(true);
    setError(null);
    setTestDone(null);
    try {
      const res = await fetch("/api/admin/emails/test", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template, sessionId, to }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "テスト送信に失敗しました。");
        return;
      }
      setTestDone(to);
    } finally {
      setTesting(false);
      // 失敗も履歴に残る（原因を後から追えるようにする）ので、成否にかかわらず読み直す
      await loadLogs();
    }
  };

  const send = async () => {
    const userIds = participants.filter((p) => selected.has(p.id)).map((p) => p.id);
    if (userIds.length === 0) {
      setError("宛先を1名以上選択してください。");
      return;
    }
    const label = TEMPLATE_LABEL[template];
    if (!window.confirm(`${userIds.length} 名に「${label}」を送信します。よろしいですか？`)) {
      return;
    }

    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/emails", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template, sessionId, userIds }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "送信に失敗しました。");
        return;
      }
      setSummary(data.summary);
      setResults(data.results ?? []);
    } finally {
      setSending(false);
      await loadLogs();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="admin-page-title">メール送信</h1>
        <p className="admin-page-note">
          {sessionName || "セッションを選択してください"}
        </p>
      </div>

      {/* リンク先が localhost のままだと、届いたメールから誰も登録できない */}
      {config && (!config.appUrl || config.appUrl.includes("localhost")) && (
        <div className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p>
            メール内のリンクの基点（NEXT_PUBLIC_APP_URL）が
            <span className="font-medium">
              {config.appUrl ? ` ${config.appUrl} ` : "未設定"}
            </span>
            です。このまま送ると受講生がリンクを開けません。本番URLを設定してください。
          </p>
        </div>
      )}

      {/* 送信設定の状態 */}
      {config && (
        <div
          className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${
            config.configured
              ? "border-border bg-accent text-accent-foreground"
              : "border-destructive/30 bg-destructive/5 text-destructive"
          }`}
        >
          {config.configured ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          )}
          <div className="min-w-0">
            {config.configured ? (
              <p>
                差出人 <span className="font-medium">{config.from}</span> ／ 返信先{" "}
                <span className="font-medium">{config.replyTo}</span>
              </p>
            ) : (
              <p>
                RESEND_API_KEY が未設定のため送信できません。プレビューのみ利用できます。
              </p>
            )}
          </div>
        </div>
      )}

      {/* ① テンプレート */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">① 送るメールを選ぶ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="grid gap-2 sm:grid-cols-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTemplate(t.key)}
                className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
                  template === t.key
                    ? "border-primary bg-accent"
                    : "border-border bg-card hover:bg-accent"
                }`}
              >
                <p className="text-sm font-bold">{TEMPLATE_LABEL[t.key]}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  対象：{t.matchLabel}（{participants.filter(t.match).length} 名）
                </p>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{def.note}</p>
        </CardContent>
      </Card>

      {/* ② 宛先 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm">
            <span>② 宛先を選ぶ</span>
            <span className="text-xs font-normal text-muted-foreground">
              {selected.size} / {participants.length} 名
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setSelected(new Set(matched.map((p) => p.id)))}
            >
              {def.matchLabel}を選ぶ（{matched.length}）
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setSelected(new Set(participants.map((p) => p.id)))}
            >
              全員
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setSelected(new Set())}
            >
              解除
            </Button>
          </div>

          {participants.length === 0 ? (
            <p className="text-sm text-muted-foreground">受講生が登録されていません。</p>
          ) : (
            <div className="max-h-72 divide-y divide-border overflow-y-auto rounded-lg border border-border">
              {participants.map((p) => {
                const isMatched = def.match(p);
                return (
                  <label
                    key={p.id}
                    className="flex cursor-pointer items-center gap-3 px-3 py-2 transition-colors hover:bg-accent"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => toggle(p.id)}
                      className="h-4 w-4 flex-shrink-0 accent-primary"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.name ?? p.email}</p>
                      <p className="truncate text-xs text-muted-foreground">{p.email}</p>
                    </div>
                    {!isMatched && (
                      <Badge variant="secondary" className="flex-shrink-0 text-[11px]">
                        対象外
                      </Badge>
                    )}
                  </label>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ③④ プレビューと送信 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">③ 本文を確認して送る</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={runPreview} disabled={previewing}>
              {previewing ? "読み込み中..." : "本文をプレビュー"}
            </Button>
            <Button
              type="button"
              onClick={send}
              disabled={sending || selected.size === 0 || !config?.configured}
            >
              <Mail className="mr-1.5 h-4 w-4" />
              {sending ? "送信中..." : `${selected.size} 名に送信する`}
            </Button>
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          {preview && (
            <div className="space-y-2 rounded-lg border border-border p-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>
                  宛先：
                  <span className="font-medium text-foreground">
                    {preview.to ?? "（サンプル表示）"}
                  </span>
                </span>
                {preview.blockedReason && (
                  <Badge variant="secondary" className="text-[11px]">
                    この方には送れません：{preview.blockedReason}
                  </Badge>
                )}
              </div>
              <p className="text-sm font-bold">{preview.subject}</p>
              <iframe
                title="メールプレビュー"
                srcDoc={preview.html}
                sandbox=""
                className="h-[420px] w-full rounded-md border border-border bg-white"
              />
            </div>
          )}

          {/* テスト送信：受講生に一斉送信する前に、実際の見え方を1通で確かめる */}
          <div className="rounded-lg border border-border bg-secondary/60 p-3">
            <p className="text-xs font-semibold text-foreground">
              テスト送信（受講生以外のアドレスに1通だけ送る）
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              宛名はダミーになりますが、差出人・日程・リンクは本番と同じ形で届きます。
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <input
                type="email"
                value={testTo}
                onChange={(e) => setTestTo(e.target.value)}
                placeholder="test@example.com"
                autoCapitalize="none"
                className="h-9 min-w-[220px] flex-1 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={sendTest}
                disabled={testing || !config?.configured}
              >
                {testing ? "送信中..." : "テスト送信"}
              </Button>
            </div>
            {testDone && (
              <p className="mt-2 text-xs text-primary">
                {testDone} にテスト送信しました。受信ボックスをご確認ください。
              </p>
            )}
          </div>

          {summary && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-3 text-sm">
                <span>依頼 {summary.requested} 件</span>
                <span className="font-medium text-primary">送信 {summary.sent}</span>
                {summary.failed > 0 && (
                  <span className="font-medium text-destructive">失敗 {summary.failed}</span>
                )}
                <span className="text-muted-foreground">スキップ {summary.skipped}</span>
              </div>
              <div className="divide-y divide-border rounded-md border border-border">
                {results.map((r, i) => {
                  const badge = RESULT_BADGE[r.status];
                  return (
                    <div key={`${r.email}-${i}`} className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Badge className={`px-1.5 py-0 text-[11px] ${badge.className}`}>
                          {badge.label}
                        </Badge>
                        <span className="truncate text-sm">{r.name ?? r.email}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {r.email}
                        </span>
                      </div>
                      {r.reason && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{r.reason}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 送信履歴 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">送信履歴</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              このセッションの送信履歴はまだありません。
            </p>
          ) : (
            <div className="divide-y divide-border rounded-md border border-border">
              {logs.map((log) => (
                <div key={log.id} className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      className={`px-1.5 py-0 text-[11px] ${
                        log.status === "sent"
                          ? "bg-primary text-primary-foreground"
                          : "bg-destructive text-destructive-foreground"
                      }`}
                    >
                      {log.status === "sent" ? "送信" : "失敗"}
                    </Badge>
                    <span className="text-xs font-medium">
                      {TEMPLATE_LABEL[log.template]}
                    </span>
                    <span className="truncate text-sm">{log.name ?? log.to}</span>
                    <span className="ml-auto flex-shrink-0 text-xs tabular-nums text-muted-foreground">
                      {formatTime(log.createdAt)}
                    </span>
                  </div>
                  {log.error && (
                    <p className="mt-0.5 text-xs text-destructive">{log.error}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
