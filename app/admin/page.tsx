"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CalendarRange,
  LayoutDashboard,
  Mail,
  SlidersHorizontal,
  UserPlus,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BLOCK_META } from "./blockMeta";
import { SessionsPanel } from "./_components/SessionsPanel";
import { InvitePanel } from "./_components/InvitePanel";
import { RosterPanel } from "./_components/RosterPanel";
import { MailPanel } from "./_components/MailPanel";
import {
  STATUS_DOT,
  STATUS_LABEL,
  formatTime,
  statusBadgeVariant,
  type BlockInfo,
  type BlockStatus,
  type Facilitator,
  type Participant,
  type SessionInfo,
} from "./types";

/**
 * 管理ダッシュボード。
 *
 * 画面の作り
 * - 左ナビ＝「いまどの仕事をしているか」だけを選ぶ（セクション切替）。
 * - 扱う研修セッションは左上のセレクトで切り替える（全セクション共通の文脈）。
 * - 中身はすべて右のメイン領域に出す。
 *   （旧版は左サイドバーがタブ・セッション・ブロック・受講生一覧を兼ねていて、
 *     同じ場所の意味が状態ごとに変わっていた。それを解いた。）
 */

type Section = "overview" | "blocks" | "participants" | "invites" | "emails" | "sessions";

const NAV: {
  key: Section;
  label: string;
  icon: typeof LayoutDashboard;
  /** 事務局（admin）だけに見せる */
  adminOnly?: boolean;
}[] = [
  { key: "overview", label: "概要", icon: LayoutDashboard },
  { key: "blocks", label: "進行（開放）", icon: SlidersHorizontal },
  { key: "participants", label: "受講生", icon: Users },
  { key: "invites", label: "招待", icon: UserPlus, adminOnly: true },
  { key: "emails", label: "メール", icon: Mail, adminOnly: true },
  { key: "sessions", label: "セッション", icon: CalendarRange },
];

export default function AdminPage() {
  const [role, setRole] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<BlockInfo[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [facilitators, setFacilitators] = useState<Facilitator[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string>("pre");
  const [section, setSection] = useState<Section>("overview");

  const isAdmin = role === "admin";
  const navItems = NAV.filter((item) => !item.adminOnly || isAdmin);

  const fetchSessionData = useCallback(async (sessionId: string) => {
    const [bRes, pRes] = await Promise.all([
      fetch(`/api/admin/blocks?sessionId=${sessionId}`, { credentials: "include" }),
      fetch(`/api/admin/participants?sessionId=${sessionId}`, { credentials: "include" }),
    ]);
    const [bData, pData] = await Promise.all([bRes.json(), pRes.json()]);
    if (!bRes.ok) throw new Error(bData.error ?? "ブロック情報の取得に失敗しました。");
    setBlocks(bData.blocks ?? []);
    setParticipants(pData.participants ?? []);
  }, []);

  const fetchData = useCallback(async () => {
    const [meRes, sRes, fRes] = await Promise.all([
      fetch("/api/auth/me", { credentials: "include" }),
      fetch("/api/admin/sessions", { credentials: "include" }),
      fetch("/api/admin/facilitators", { credentials: "include" }),
    ]);
    if (sRes.status === 401 || sRes.status === 403) {
      window.location.href = "/login?from=/admin";
      return;
    }
    const [meData, sData, fData] = await Promise.all([
      meRes.json().catch(() => ({})),
      sRes.json(),
      fRes.json().catch(() => ({})),
    ]);
    setRole(meData.user?.role ?? null);
    setFacilitators(fData.facilitators ?? []);

    const sessionList: SessionInfo[] = sData.sessions ?? [];
    setSessions(sessionList);
    if (sessionList.length === 0) {
      setLoading(false);
      return;
    }
    setSelectedSessionId(sessionList[0].id);
    await fetchSessionData(sessionList[0].id);
    setLoading(false);
  }, [fetchSessionData]);

  useEffect(() => {
    fetchData().catch(() => {
      setError("データの取得に失敗しました。");
      setLoading(false);
    });
  }, [fetchData]);

  const switchSession = useCallback(
    async (sessionId: string) => {
      setSelectedSessionId(sessionId);
      try {
        await fetchSessionData(sessionId);
      } catch {
        setError("セッションデータの取得に失敗しました。");
      }
    },
    [fetchSessionData]
  );

  const refreshParticipants = useCallback(async () => {
    if (!selectedSessionId) return;
    const res = await fetch(`/api/admin/participants?sessionId=${selectedSessionId}`, {
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) setParticipants(data.participants ?? []);
  }, [selectedSessionId]);

  const updateBlock = async (blockId: string, status: BlockStatus) => {
    setUpdating(blockId);
    try {
      const res = await fetch("/api/admin/blocks", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockId, status, sessionId: selectedSessionId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error ?? "更新に失敗しました。");
        return;
      }
      // cascaded: 例）Day1を停止すると、まだ講師が触っていなければ宿題が自動開放される
      const changes: { blockId: string; status: BlockStatus }[] = [
        { blockId, status },
        ...((data.cascaded ?? []) as { blockId: string; status: BlockStatus }[]),
      ];
      setBlocks((prev) =>
        prev.map((b) => {
          const change = changes.find((c) => c.blockId === b.blockId);
          if (!change) return b;
          return {
            ...b,
            status: change.status,
            openedAt: change.status === "OPEN" ? new Date().toISOString() : b.openedAt,
          };
        })
      );
    } finally {
      setUpdating(null);
    }
  };

  const updateAttendance = async (
    id: string,
    patch: { attendanceDay1?: boolean | null; attendanceDay2?: boolean | null }
  ) => {
    const res = await fetch(`/api/admin/participants/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "出欠の更新に失敗しました。");
      return;
    }
    setParticipants((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const totalParticipants = participants.length;
  const completionCount = (blockId: string) =>
    participants.filter((p) => p.completedPhases.includes(blockId)).length;
  const statusOf = (blockId: string): BlockStatus =>
    blocks.find((b) => b.blockId === blockId)?.status ?? "LOCKED";

  const selectedMeta = BLOCK_META.find((m) => m.id === selectedBlockId) ?? BLOCK_META[0];
  const selectedBlock = blocks.find((b) => b.blockId === selectedBlockId);
  const selectedStatus = statusOf(selectedBlockId);
  const currentSession = sessions.find((s) => s.id === selectedSessionId);
  const currentSessionLabel = currentSession
    ? `${currentSession.name ?? "（名前なし）"}（${currentSession.code}）`
    : "";

  const activatedCount = participants.filter((p) => p.inviteStatus === "activated").length;
  const notInvitedCount = participants.filter((p) => p.inviteStatus === "none").length;
  const preDoneCount = participants.filter((p) => p.preSurveyDone && p.profileSlideDone).length;
  const completedCount = participants.filter((p) => p.completedAt).length;

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
    <div className="flex flex-1 flex-col lg:flex-row">
      {/* ===== 左ナビ（モバイルでは上部の横スクロール） ===== */}
      <aside className="flex flex-shrink-0 flex-col border-b border-border bg-card lg:w-60 lg:border-b-0 lg:border-r">
        <div className="border-b border-border p-3">
          <label
            htmlFor="admin-session"
            className="text-xs font-medium text-muted-foreground"
          >
            管理中の研修
          </label>
          {sessions.length === 0 ? (
            <p className="mt-1.5 text-sm text-muted-foreground">
              セッションがありません
            </p>
          ) : (
            <>
              <select
                id="admin-session"
                value={selectedSessionId}
                onChange={(e) => switchSession(e.target.value)}
                className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name ?? "（名前なし）"}（{s.code}）
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-muted-foreground">
                受講生 {totalParticipants} 名 ·{" "}
                {currentSession?.isOnline ? "オンライン" : "対面"}
              </p>
            </>
          )}
        </div>

        <nav className="flex gap-1 overflow-x-auto p-2 lg:flex-col lg:overflow-visible">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setSection(item.key)}
                className={`admin-nav-item flex-shrink-0 lg:w-full ${
                  section === item.key ? "is-active" : ""
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="whitespace-nowrap">{item.label}</span>
                {item.key === "participants" && totalParticipants > 0 && (
                  <Badge variant="secondary" className="ml-auto text-[11px]">
                    {totalParticipants}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ===== メイン ===== */}
      <main className="min-w-0 flex-1 bg-background">
        <div className="mx-auto max-w-4xl px-4 py-6 md:px-8">
          {section === "overview" && (
            <div className="space-y-6">
              <div>
                <h1 className="admin-page-title">概要</h1>
                <p className="admin-page-note">
                  {currentSessionLabel || "セッションを選択してください"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="admin-stat">
                  <p className="admin-stat-label">受講生</p>
                  <p className="admin-stat-value">{totalParticipants}</p>
                </div>
                <div className="admin-stat">
                  <p className="admin-stat-label">アカウント有効化</p>
                  <p className="admin-stat-value">
                    {activatedCount}
                    <span className="ml-1 text-sm font-medium text-muted-foreground">
                      / {totalParticipants}
                    </span>
                  </p>
                </div>
                <div className="admin-stat">
                  <p className="admin-stat-label">事前課題 提出</p>
                  <p className="admin-stat-value">
                    {preDoneCount}
                    <span className="ml-1 text-sm font-medium text-muted-foreground">
                      / {totalParticipants}
                    </span>
                  </p>
                </div>
                <div className="admin-stat">
                  <p className="admin-stat-label">修了</p>
                  <p className="admin-stat-value">
                    {completedCount}
                    <span className="ml-1 text-sm font-medium text-muted-foreground">
                      / {totalParticipants}
                    </span>
                  </p>
                </div>
              </div>

              {notInvitedCount > 0 && isAdmin && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-accent px-4 py-3">
                  <p className="text-sm text-accent-foreground">
                    招待メールが未送信の受講生が {notInvitedCount} 名います。
                  </p>
                  <Button size="sm" onClick={() => setSection("emails")}>
                    メールへ
                  </Button>
                </div>
              )}

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">ブロックの進行</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {BLOCK_META.map((meta) => {
                    const status = statusOf(meta.id);
                    const done = completionCount(meta.id);
                    const pct = totalParticipants
                      ? Math.round((done / totalParticipants) * 100)
                      : 0;
                    return (
                      <button
                        key={meta.id}
                        type="button"
                        onClick={() => {
                          setSelectedBlockId(meta.id);
                          setSection("blocks");
                        }}
                        className="block w-full rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-accent"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2 w-2 flex-shrink-0 rounded-full ${STATUS_DOT[status]}`}
                          />
                          <span className="flex-1 text-sm font-medium">{meta.shortLabel}</span>
                          <span className="text-xs tabular-nums text-muted-foreground">
                            {done}/{totalParticipants}
                          </span>
                          <Badge
                            variant={statusBadgeVariant(status)}
                            className="w-[68px] justify-center px-1.5 py-0 text-[11px]"
                          >
                            {STATUS_LABEL[status]}
                          </Badge>
                        </div>
                        <Progress value={pct} className="mt-1.5 h-1" />
                      </button>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          )}

          {section === "blocks" && (
            <div className="space-y-6">
              <div>
                <h1 className="admin-page-title">進行（ブロック開放）</h1>
                <p className="admin-page-note">
                  受講生が入れる範囲を、研修の進み方に合わせて開け閉めします。
                </p>
              </div>

              {sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  「セッション」タブで研修を作成してください。
                </p>
              ) : (
                <>
                  {/* ブロック選択（横並びのステップ） */}
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {BLOCK_META.map((meta) => {
                      const status = statusOf(meta.id);
                      const isSelected = selectedBlockId === meta.id;
                      return (
                        <button
                          key={meta.id}
                          type="button"
                          onClick={() => setSelectedBlockId(meta.id)}
                          className={`min-w-[124px] flex-1 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                            isSelected
                              ? "border-primary bg-accent"
                              : "border-border bg-card hover:bg-accent"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`h-2 w-2 flex-shrink-0 rounded-full ${STATUS_DOT[status]}`}
                            />
                            <span className="text-xs font-bold">{meta.shortLabel}</span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {STATUS_LABEL[status]} · {completionCount(meta.id)}/
                            {totalParticipants}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  {/* 選択中ブロックの操作 */}
                  <Card>
                    <CardContent className="pt-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{selectedMeta.day}</span>
                            <span>·</span>
                            <span>{selectedMeta.step}</span>
                          </div>
                          <h2 className="mt-1 text-lg font-bold">{selectedMeta.label}</h2>
                        </div>
                        <Badge variant={statusBadgeVariant(selectedStatus)}>
                          {STATUS_LABEL[selectedStatus]}
                        </Badge>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {selectedStatus !== "OPEN" && (
                          <Button
                            size="sm"
                            disabled={updating === selectedMeta.id}
                            onClick={() => updateBlock(selectedMeta.id, "OPEN")}
                          >
                            ▶ 開放する
                          </Button>
                        )}
                        {selectedStatus === "OPEN" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={updating === selectedMeta.id}
                            onClick={() => updateBlock(selectedMeta.id, "CLOSED")}
                          >
                            ⏸ 停止する
                          </Button>
                        )}
                        {selectedStatus !== "LOCKED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updating === selectedMeta.id}
                            onClick={() => updateBlock(selectedMeta.id, "LOCKED")}
                          >
                            🔒 ロックに戻す
                          </Button>
                        )}
                      </div>

                      {selectedStatus !== "LOCKED" && totalParticipants > 0 && (
                        <div className="mt-4 border-t border-border pt-4">
                          <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">完了した受講生</span>
                            <span className="font-bold tabular-nums">
                              {completionCount(selectedMeta.id)} / {totalParticipants} 名
                            </span>
                          </div>
                          <Progress
                            value={
                              (completionCount(selectedMeta.id) / totalParticipants) * 100
                            }
                            className="h-2"
                          />
                          {selectedBlock?.openedAt && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              開放日時：{formatTime(selectedBlock.openedAt)}
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="space-y-4 pt-5">
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {selectedMeta.description}
                      </p>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          受講生が行うこと
                        </p>
                        <ol className="mt-2 space-y-2">
                          {selectedMeta.tasks.map((task, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm">
                              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                                {i + 1}
                              </span>
                              {task}
                            </li>
                          ))}
                        </ol>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          入力項目
                        </p>
                        <ul className="mt-2 space-y-1.5">
                          {selectedMeta.inputs.map((input, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-sm text-muted-foreground"
                            >
                              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-border" />
                              {input}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="rounded-lg border border-border bg-accent p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-accent-foreground">
                          完了条件・アウトプット
                        </p>
                        <p className="mt-1 text-sm">{selectedMeta.output}</p>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}

          {section === "participants" && (
            <RosterPanel
              participants={participants}
              sessionName={currentSessionLabel}
              onAttendanceChange={updateAttendance}
            />
          )}

          {section === "invites" && (
            <InvitePanel
              sessions={sessions}
              selectedSessionId={selectedSessionId}
              onInvited={refreshParticipants}
              onGoToMail={() => setSection("emails")}
            />
          )}

          {section === "emails" && (
            <MailPanel
              participants={participants}
              sessionId={selectedSessionId}
              sessionName={currentSessionLabel}
            />
          )}

          {section === "sessions" && (
            <SessionsPanel
              sessions={sessions}
              facilitators={facilitators}
              selectedSessionId={selectedSessionId}
              canManage={isAdmin}
              onCreated={(s) => setSessions((prev) => [s, ...prev])}
              onUpdated={(s) =>
                setSessions((prev) => prev.map((x) => (x.id === s.id ? { ...x, ...s } : x)))
              }
              onSwitchSession={switchSession}
            />
          )}
        </div>
      </main>
    </div>
  );
}
