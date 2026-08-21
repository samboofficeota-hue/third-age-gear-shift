"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarRange,
  Mail,
  Presentation,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { InfoPanel } from "../../_components/InfoPanel";
import { BlocksPanel } from "../../_components/BlocksPanel";
import { RosterPanel } from "../../_components/RosterPanel";
import { InvitePanel } from "../../_components/InvitePanel";
import { MailPanel } from "../../_components/MailPanel";
import { TrainerPanel } from "../../_components/TrainerPanel";
import type {
  BlockInfo,
  BlockStatus,
  Participant,
  SessionInfo,
} from "../../types";

/**
 * 1つの研修のダッシュボード。
 *
 * 研修を選んだあとの操作はすべてここに集約する（実施情報／受講生／進行状況／
 * メール操作／講師画面）。どのタブにいても文脈は「この研修」で固定されるので、
 * 別の研修に対して操作してしまう事故が起きない。
 */

type Tab = "info" | "participants" | "blocks" | "mail" | "trainer";

const TABS: { key: Tab; label: string; icon: typeof Users }[] = [
  { key: "info", label: "実施情報", icon: CalendarRange },
  { key: "participants", label: "受講生", icon: Users },
  { key: "blocks", label: "進行状況", icon: SlidersHorizontal },
  { key: "mail", label: "メール操作", icon: Mail },
  { key: "trainer", label: "講師画面", icon: Presentation },
];

export default function SessionDashboardPage({ params }: { params: { id: string } }) {
  const sessionId = params.id;

  const [session, setSession] = useState<SessionInfo | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [blocks, setBlocks] = useState<BlockInfo[]>([]);
  const [tab, setTab] = useState<Tab>("info");
  const [selectedBlockId, setSelectedBlockId] = useState("pre");
  const [updating, setUpdating] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // /admin に入れるのは admin だけ（middleware で担保）。タブの出し分けは不要。

  const load = useCallback(async () => {
    const [sRes, bRes, pRes] = await Promise.all([
      fetch("/api/admin/sessions", { credentials: "include" }),
      fetch(`/api/admin/blocks?sessionId=${sessionId}`, { credentials: "include" }),
      fetch(`/api/admin/participants?sessionId=${sessionId}`, { credentials: "include" }),
    ]);
    if (sRes.status === 401 || sRes.status === 403) {
      window.location.href = `/login?from=/admin/sessions/${sessionId}`;
      return;
    }
    const [sData, bData, pData] = await Promise.all([
      sRes.json(),
      bRes.json().catch(() => ({})),
      pRes.json().catch(() => ({})),
    ]);

    const found = (sData.sessions ?? []).find((s: SessionInfo) => s.id === sessionId);
    if (!found) {
      setError("この研修は見つからないか、閲覧する権限がありません。");
      setLoading(false);
      return;
    }
    setSession(found);
    setBlocks(bData.blocks ?? []);
    setParticipants(pData.participants ?? []);
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    load().catch(() => {
      setError("データの取得に失敗しました。");
      setLoading(false);
    });
  }, [load]);

  const refreshParticipants = useCallback(async () => {
    const res = await fetch(`/api/admin/participants?sessionId=${sessionId}`, {
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) setParticipants(data.participants ?? []);
  }, [sessionId]);

  const updateBlock = async (blockId: string, status: BlockStatus) => {
    setUpdating(blockId);
    try {
      const res = await fetch("/api/admin/blocks", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockId, status, sessionId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error ?? "更新に失敗しました。");
        return;
      }
      // cascaded: 例）Day1を停止すると、まだ運営が触っていなければ宿題が自動開放される
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

  if (loading)
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      </div>
    );
  if (error || !session)
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24">
        <p className="text-sm text-destructive">{error}</p>
        <Link href="/admin" className="text-sm text-primary hover:underline">
          研修一覧へ戻る
        </Link>
      </div>
    );

  const sessionLabel = `${session.name ?? "（名前なし）"}（${session.code}）`;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        研修一覧
      </Link>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-bold">{session.name ?? "（名前なし）"}</h1>
        <span className="font-mono text-sm text-muted-foreground">{session.code}</span>
        {!session.isActive && <Badge variant="secondary">終了</Badge>}
      </div>

      <nav className="mt-4 flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex flex-shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                tab === t.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
              {t.key === "participants" && participants.length > 0 && (
                <Badge variant="secondary" className="ml-0.5 text-caption">
                  {participants.length}
                </Badge>
              )}
            </button>
          );
        })}
      </nav>

      <div className="py-6">
        {tab === "info" && (
          <InfoPanel
            session={session}
            participants={participants}
            blocks={blocks}
            onUpdated={(s) => setSession((prev) => (prev ? { ...prev, ...s } : s))}
          />
        )}

        {tab === "participants" && (
          <div className="space-y-8">
            <RosterPanel
              sessionId={sessionId}
              participants={participants}
              sessionName={sessionLabel}
              onAttendanceChange={updateAttendance}
            />
            <div className="border-t border-border pt-8">
              <InvitePanel
                sessionId={sessionId}
                onInvited={refreshParticipants}
                onGoToMail={() => setTab("mail")}
              />
            </div>
          </div>
        )}

        {tab === "blocks" && (
          <BlocksPanel
            blocks={blocks}
            participants={participants}
            selectedBlockId={selectedBlockId}
            onSelectBlock={setSelectedBlockId}
            updating={updating}
            onUpdateBlock={updateBlock}
          />
        )}

        {tab === "mail" && (
          <MailPanel
            participants={participants}
            sessionId={sessionId}
            sessionName={sessionLabel}
          />
        )}

        {tab === "trainer" && (
          <TrainerPanel sessionId={sessionId} participants={participants} />
        )}
      </div>
    </div>
  );
}
