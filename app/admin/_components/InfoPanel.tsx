"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BLOCK_META } from "../blockMeta";
import { SessionForm } from "./SessionForm";
import {
  STATUS_DOT,
  STATUS_LABEL,
  statusBadgeVariant,
  type BlockInfo,
  type BlockStatus,
  type Participant,
  type SessionInfo,
} from "../types";
import { Badge } from "@/components/ui/badge";

/**
 * 実施情報。この研修の「いまどうなっているか」を1枚で見せ、
 * 開催条件（日程・会場・担当講師）をその場で直せるようにする。
 */
export function InfoPanel({
  session,
  participants,
  blocks,
  onUpdated,
}: {
  session: SessionInfo;
  participants: Participant[];
  blocks: BlockInfo[];
  onUpdated: (session: SessionInfo) => void;
}) {
  const total = participants.length;
  const activated = participants.filter((p) => p.inviteStatus === "activated").length;
  const preDone = participants.filter(
    (p) => p.preSurveyDone && p.profileSlideDone
  ).length;
  const completed = participants.filter((p) => p.completedAt).length;
  const statusOf = (blockId: string): BlockStatus =>
    blocks.find((b) => b.blockId === blockId)?.status ?? "LOCKED";
  const completionCount = (blockId: string) =>
    participants.filter((p) => p.completedPhases.includes(blockId)).length;

  const toggleActive = async () => {
    const res = await fetch("/api/admin/sessions", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: session.id, isActive: !session.isActive }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) onUpdated(data.session);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="admin-page-title">実施情報</h1>
        <p className="admin-page-note">この研修の状況と開催条件です。</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="admin-stat">
          <p className="admin-stat-label">受講生</p>
          <p className="admin-stat-value">{total}</p>
        </div>
        <div className="admin-stat">
          <p className="admin-stat-label">アカウント有効化</p>
          <p className="admin-stat-value">
            {activated}
            <span className="ml-1 text-sm font-medium text-muted-foreground">/ {total}</span>
          </p>
        </div>
        <div className="admin-stat">
          <p className="admin-stat-label">事前課題 提出</p>
          <p className="admin-stat-value">
            {preDone}
            <span className="ml-1 text-sm font-medium text-muted-foreground">/ {total}</span>
          </p>
        </div>
        <div className="admin-stat">
          <p className="admin-stat-label">修了</p>
          <p className="admin-stat-value">
            {completed}
            <span className="ml-1 text-sm font-medium text-muted-foreground">/ {total}</span>
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-3 pt-5">
          <p className="text-sm font-bold">ブロックの進行</p>
          {BLOCK_META.map((meta) => {
            const status = statusOf(meta.id);
            const done = completionCount(meta.id);
            const pct = total ? Math.round((done / total) * 100) : 0;
            return (
              <div key={meta.id}>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 flex-shrink-0 rounded-full ${STATUS_DOT[status]}`} />
                  <span className="flex-1 text-sm font-medium">{meta.shortLabel}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {done}/{total}
                  </span>
                  <Badge
                    variant={statusBadgeVariant(status)}
                    className="justify-center whitespace-nowrap px-2 py-0.5 text-caption"
                  >
                    {STATUS_LABEL[status]}
                  </Badge>
                </div>
                <Progress value={pct} className="mt-1.5 h-1" />
              </div>
            );
          })}
        </CardContent>
      </Card>

        <div className="space-y-3">
          <p className="text-sm font-bold">開催条件</p>
          <SessionForm session={session} onSaved={onUpdated} />
          <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
            <div>
              <p className="text-sm font-medium">
                {session.isActive ? "実施中の研修です" : "終了した研修です"}
              </p>
              <p className="text-xs text-muted-foreground">
                終了にすると一覧で「終了」と表示されます。データは消えません。
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={toggleActive}>
              {session.isActive ? "終了にする" : "実施中に戻す"}
            </Button>
          </div>
        </div>
    </div>
  );
}
