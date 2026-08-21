"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BLOCK_META } from "../blockMeta";
import {
  STATUS_DOT,
  STATUS_LABEL,
  formatTime,
  statusBadgeVariant,
  type BlockInfo,
  type BlockStatus,
  type Participant,
} from "../types";

/**
 * 進行状況（A-2 / D-1）。受講生が入れる範囲を研修の進み方に合わせて開け閉めする。
 * 上のステップで対象ブロックを選び、その場で開放・停止・ロックまで完結させる。
 */
export function BlocksPanel({
  blocks,
  participants,
  selectedBlockId,
  onSelectBlock,
  updating,
  onUpdateBlock,
}: {
  blocks: BlockInfo[];
  participants: Participant[];
  selectedBlockId: string;
  onSelectBlock: (id: string) => void;
  /** 更新中のブロックID（ボタンの二重押し防止） */
  updating: string | null;
  onUpdateBlock: (blockId: string, status: BlockStatus) => void;
}) {
  const total = participants.length;
  const completionCount = (blockId: string) =>
    participants.filter((p) => p.completedPhases.includes(blockId)).length;
  const statusOf = (blockId: string): BlockStatus =>
    blocks.find((b) => b.blockId === blockId)?.status ?? "LOCKED";

  const meta = BLOCK_META.find((m) => m.id === selectedBlockId) ?? BLOCK_META[0];
  const block = blocks.find((b) => b.blockId === meta.id);
  const status = statusOf(meta.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="admin-page-title">進行状況</h1>
        <p className="admin-page-note">
          受講生が入れる範囲を、研修の進み方に合わせて開け閉めします。
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {BLOCK_META.map((m) => {
          const s = statusOf(m.id);
          const isSelected = selectedBlockId === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelectBlock(m.id)}
              className={`min-w-[124px] flex-1 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                isSelected
                  ? "border-primary bg-accent"
                  : "border-border bg-card hover:bg-accent"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 flex-shrink-0 rounded-full ${STATUS_DOT[s]}`} />
                <span className="text-xs font-bold">{m.shortLabel}</span>
              </div>
              <p className="mt-0.5 text-caption text-muted-foreground">
                {STATUS_LABEL[s]} · {completionCount(m.id)}/{total}
              </p>
            </button>
          );
        })}
      </div>

      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{meta.day}</span>
                <span>·</span>
                <span>{meta.step}</span>
              </div>
              <h2 className="mt-1 text-lg font-bold">{meta.label}</h2>
            </div>
            <Badge variant={statusBadgeVariant(status)}>{STATUS_LABEL[status]}</Badge>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {status !== "OPEN" && (
              <Button
                size="sm"
                disabled={updating === meta.id}
                onClick={() => onUpdateBlock(meta.id, "OPEN")}
              >
                ▶ 開放する
              </Button>
            )}
            {status === "OPEN" && (
              <Button
                size="sm"
                variant="destructive"
                disabled={updating === meta.id}
                onClick={() => onUpdateBlock(meta.id, "CLOSED")}
              >
                ⏸ 停止する
              </Button>
            )}
            {status !== "LOCKED" && (
              <Button
                size="sm"
                variant="outline"
                disabled={updating === meta.id}
                onClick={() => onUpdateBlock(meta.id, "LOCKED")}
              >
                🔒 ロックに戻す
              </Button>
            )}
          </div>

          {status !== "LOCKED" && total > 0 && (
            <div className="mt-4 border-t border-border pt-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">完了した受講生</span>
                <span className="font-bold tabular-nums">
                  {completionCount(meta.id)} / {total} 名
                </span>
              </div>
              <Progress value={(completionCount(meta.id) / total) * 100} className="h-2" />
              {block?.openedAt && (
                <p className="mt-2 text-xs text-muted-foreground">
                  開放日時：{formatTime(block.openedAt)}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-5">
          <p className="text-sm leading-relaxed text-muted-foreground">{meta.description}</p>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              受講生が行うこと
            </p>
            <ol className="mt-2 space-y-2">
              {meta.tasks.map((task, i) => (
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
              {meta.inputs.map((input, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
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
            <p className="mt-1 text-sm">{meta.output}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
