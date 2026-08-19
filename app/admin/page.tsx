"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BLOCK_META } from "./blockMeta";
import { SessionsPanel } from "./_components/SessionsPanel";
import { InvitePanel } from "./_components/InvitePanel";
import { RosterPanel } from "./_components/RosterPanel";
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

type SideTab = "blocks" | "participants" | "sessions" | "invites";

const TAB_LABEL: Record<SideTab, string> = {
  blocks: "ブロック",
  participants: "受講生",
  sessions: "セッション",
  invites: "招待",
};

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
  const [sideTab, setSideTab] = useState<SideTab>("blocks");

  const isAdmin = role === "admin";
  const tabs: SideTab[] = isAdmin
    ? ["blocks", "participants", "sessions", "invites"]
    : ["blocks", "participants", "sessions"];

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
      setSideTab("blocks");
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
  const selectedMeta = BLOCK_META.find((m) => m.id === selectedBlockId) ?? BLOCK_META[0];
  const selectedBlock = blocks.find((b) => b.blockId === selectedBlockId);
  const selectedStatus: BlockStatus = selectedBlock?.status ?? "LOCKED";
  const currentSession = sessions.find((s) => s.id === selectedSessionId);
  const currentSessionLabel = currentSession
    ? `${currentSession.name ?? "（名前なし）"}（${currentSession.code}）`
    : "";

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      </div>
    );
  if (error)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">
      {/* ===== 左サイドバー ===== */}
      <aside className="flex w-72 flex-shrink-0 flex-col border-r bg-card">
        <div className="flex border-b">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setSideTab(tab)}
              className={`flex-1 border-b-2 py-3 text-xs font-medium transition-colors ${
                sideTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {TAB_LABEL[tab]}
              {tab === "participants" && totalParticipants > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px]">
                  {totalParticipants}
                </Badge>
              )}
            </button>
          ))}
        </div>

        {/* 現在のセッション */}
        {(sideTab === "blocks" || sideTab === "participants") && (
          <div className="border-b px-4 py-2.5">
            {currentSession ? (
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">
                    {currentSession.name ?? "（名前なし）"}
                  </p>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {currentSession.code}
                  </p>
                </div>
                <span className="flex-shrink-0 text-xs text-muted-foreground">
                  受講生 {totalParticipants} 名
                </span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">セッションを選択してください</p>
            )}
          </div>
        )}

        {/* ブロック一覧 */}
        {sideTab === "blocks" && (
          <nav className="flex-1 overflow-y-auto py-1">
            {sessions.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-muted-foreground">
                セッションタブで作成してください
              </p>
            ) : (
              BLOCK_META.map((meta) => {
                const blockInfo = blocks.find((b) => b.blockId === meta.id);
                const status: BlockStatus = blockInfo?.status ?? "LOCKED";
                const isSelected = selectedBlockId === meta.id;
                const isUpdating = updating === meta.id;
                const done = completionCount(meta.id);
                return (
                  <div
                    key={meta.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedBlockId(meta.id)}
                    onKeyDown={(e) => e.key === "Enter" && setSelectedBlockId(meta.id)}
                    className={`w-full cursor-pointer px-4 py-3 text-left transition-colors ${
                      isSelected
                        ? "border-l-2 border-primary bg-accent"
                        : "border-l-2 border-transparent hover:bg-accent/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`mt-0.5 h-2 w-2 flex-shrink-0 rounded-full ${STATUS_DOT[status]}`}
                      />
                      <span className="flex-1 text-xs font-medium">
                        {meta.shortLabel}
                        <span className="ml-1 font-normal text-muted-foreground">
                          {meta.step}
                        </span>
                      </span>
                      <Badge
                        variant={statusBadgeVariant(status)}
                        className="px-1.5 py-0 text-[10px]"
                      >
                        {STATUS_LABEL[status]}
                      </Badge>
                    </div>
                    {status !== "LOCKED" && (
                      <p className="mt-1 pl-4 text-[10px] text-muted-foreground">
                        完了 {done}/{totalParticipants} 名
                      </p>
                    )}
                    {isSelected && (
                      <div className="mt-2 flex flex-wrap gap-1.5 pl-4">
                        {status !== "OPEN" && (
                          <Button
                            size="sm"
                            variant="default"
                            disabled={isUpdating}
                            className="h-6 px-2 text-[10px]"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateBlock(meta.id, "OPEN");
                            }}
                          >
                            ▶ 開放する
                          </Button>
                        )}
                        {status === "OPEN" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={isUpdating}
                            className="h-6 px-2 text-[10px]"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateBlock(meta.id, "CLOSED");
                            }}
                          >
                            ⏸ 停止する
                          </Button>
                        )}
                        {status !== "LOCKED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isUpdating}
                            className="h-6 px-2 text-[10px]"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateBlock(meta.id, "LOCKED");
                            }}
                          >
                            🔒 ロック
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </nav>
        )}

        {/* 受講生一覧 */}
        {sideTab === "participants" && (
          <div className="flex-1 overflow-y-auto py-1">
            {participants.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-muted-foreground">
                受講生が登録されていません
              </p>
            ) : (
              participants.map((p) => {
                const progress = Math.round((p.completedPhases.length / 5) * 100);
                return (
                  <Link
                    key={p.id}
                    href={`/admin/participants/${p.id}`}
                    className="block w-full px-4 py-3 text-left transition-colors hover:bg-accent/50"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {(p.name ?? p.email).slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium">{p.name ?? p.email}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {p.completedPhases.length}/5 完了
                        </p>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">
                        {progress}%
                      </span>
                    </div>
                    <Progress value={progress} className="mt-1.5 h-1" />
                  </Link>
                );
              })
            )}
          </div>
        )}

        {/* セッション一覧（セッション／招待タブ共通） */}
        {(sideTab === "sessions" || sideTab === "invites") && (
          <div className="flex-1 overflow-y-auto py-1">
            {sessions.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-muted-foreground">
                セッションがありません
              </p>
            ) : (
              sessions.map((s) => {
                const isManaging = s.id === selectedSessionId;
                return (
                  <div
                    key={s.id}
                    className={`border-b px-4 py-3 ${isManaging ? "bg-primary/5" : ""}`}
                  >
                    <div className="flex items-center gap-1.5">
                      {isManaging && <Badge className="px-1.5 py-0 text-[9px]">管理中</Badge>}
                      <p className="truncate text-xs font-bold">{s.name ?? "（名前なし）"}</p>
                    </div>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">{s.code}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      受講生 {s.participantCount} 名 · {s.isOnline ? "オンライン" : "対面"}
                    </p>
                    {!isManaging && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 h-7 w-full border-primary/30 text-xs text-primary hover:bg-primary/5"
                        onClick={() => switchSession(s.id)}
                      >
                        このセッションを管理する
                      </Button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </aside>

      {/* ===== 右パネル ===== */}
      <main className="flex flex-1 flex-col overflow-hidden bg-stone-50">
        <div className="flex-1 overflow-y-auto p-6">
          {sideTab === "sessions" && (
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

          {sideTab === "invites" && (
            <InvitePanel
              sessions={sessions}
              selectedSessionId={selectedSessionId}
              onInvited={refreshParticipants}
            />
          )}

          {sideTab === "participants" && (
            <RosterPanel
              participants={participants}
              sessionName={currentSessionLabel}
              onAttendanceChange={updateAttendance}
            />
          )}

          {sideTab === "blocks" && (
            <div className="mx-auto max-w-2xl space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{selectedMeta.day}</span>
                    <span>·</span>
                    <span>{selectedMeta.step}</span>
                  </div>
                  <h2 className="mt-1 text-xl font-bold">{selectedMeta.label}</h2>
                </div>
                <Badge variant={statusBadgeVariant(selectedStatus)} className="mt-1">
                  {STATUS_LABEL[selectedStatus]}
                </Badge>
              </div>

              <Card>
                <CardContent className="pt-5">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {selectedMeta.description}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    受講生が行うこと
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ol className="space-y-2">
                    {selectedMeta.tasks.map((task, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {i + 1}
                        </span>
                        {task}
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    入力項目
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-1.5">
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
                </CardContent>
              </Card>

              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary/70">
                  完了条件・アウトプット
                </p>
                <p className="mt-1 text-sm">{selectedMeta.output}</p>
              </div>

              {selectedStatus !== "LOCKED" && totalParticipants > 0 && (
                <Card>
                  <CardContent className="pt-5">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">完了した受講生</span>
                      <span className="font-bold">
                        {completionCount(selectedMeta.id)} / {totalParticipants} 名
                      </span>
                    </div>
                    <Progress
                      value={(completionCount(selectedMeta.id) / totalParticipants) * 100}
                      className="h-2"
                    />
                    {selectedBlock?.openedAt && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        開放日時：{formatTime(selectedBlock.openedAt)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
