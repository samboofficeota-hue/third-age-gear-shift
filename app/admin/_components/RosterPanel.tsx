"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTime, type Participant } from "../types";

/**
 * 受講生名簿（F-1）。事前課題の提出状況・出欠・じぶん紹介への導線をまとめる。
 * Day1の発表ファシリ（F-2）はここの「じぶん紹介」リンクから入る。
 */

const INVITE_LABEL: Record<Participant["inviteStatus"], { label: string; className: string }> = {
  activated: { label: "有効化済", className: "bg-primary/10 text-primary" },
  invited: { label: "招待中", className: "bg-amber-100 text-amber-700" },
  none: { label: "未招待", className: "bg-stone-100 text-stone-500" },
};

function DoneMark({ done }: { done: boolean }) {
  return (
    <span
      className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
        done ? "bg-primary text-primary-foreground" : "bg-stone-100 text-stone-400"
      }`}
    >
      {done ? "✓" : "—"}
    </span>
  );
}

function AttendanceToggle({
  value,
  disabled,
  onChange,
}: {
  value: boolean | null;
  disabled: boolean;
  onChange: (next: boolean | null) => void;
}) {
  // 3状態を1つのボタンで回す：未記録 → 出席 → 欠席 → 未記録
  const next = value === null ? true : value ? false : null;
  const view =
    value === null
      ? { label: "未記録", className: "bg-stone-100 text-stone-500" }
      : value
        ? { label: "出席", className: "bg-primary/15 text-primary" }
        : { label: "欠席", className: "bg-destructive/10 text-destructive" };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(next)}
      className={`rounded px-2 py-0.5 text-[11px] font-medium transition disabled:opacity-50 ${view.className}`}
    >
      {view.label}
    </button>
  );
}

export function RosterPanel({
  participants,
  sessionName,
  onAttendanceChange,
}: {
  participants: Participant[];
  sessionName: string;
  onAttendanceChange: (
    id: string,
    patch: { attendanceDay1?: boolean | null; attendanceDay2?: boolean | null }
  ) => Promise<void>;
}) {
  const [savingId, setSavingId] = useState<string | null>(null);

  const handleAttendance = async (
    id: string,
    patch: { attendanceDay1?: boolean | null; attendanceDay2?: boolean | null }
  ) => {
    setSavingId(id);
    try {
      await onAttendanceChange(id, patch);
    } finally {
      setSavingId(null);
    }
  };

  const surveyDone = participants.filter((p) => p.preSurveyDone).length;
  const slideDone = participants.filter((p) => p.profileSlideDone).length;
  const activated = participants.filter((p) => p.inviteStatus === "activated").length;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <h2 className="text-lg font-bold">受講生名簿</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {sessionName || "セッション未選択"} · {participants.length} 名
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "アカウント有効化", value: activated },
          { label: "事前アンケート提出", value: surveyDone },
          { label: "じぶん紹介提出", value: slideDone },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold">
                {stat.value}
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  / {participants.length}
                </span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">提出状況・出欠</CardTitle>
        </CardHeader>
        {participants.length === 0 ? (
          <CardContent>
            <p className="py-6 text-center text-sm text-muted-foreground">
              受講生が登録されていません。「招待」タブから登録してください。
            </p>
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-y bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">受講生</th>
                  <th className="px-2 py-2 text-center font-medium">状態</th>
                  <th className="px-2 py-2 text-center font-medium">アンケート</th>
                  <th className="px-2 py-2 text-center font-medium">じぶん紹介</th>
                  <th className="px-2 py-2 text-center font-medium">Day1</th>
                  <th className="px-2 py-2 text-center font-medium">Day2</th>
                  <th className="px-2 py-2 text-center font-medium">進捗</th>
                  <th className="px-4 py-2 text-right font-medium">最終更新</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {participants.map((p) => {
                  const invite = INVITE_LABEL[p.inviteStatus];
                  const saving = savingId === p.id;
                  return (
                    <tr key={p.id} className="hover:bg-accent/30">
                      <td className="px-4 py-2.5">
                        <p className="font-medium">{p.name ?? p.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {[p.organizationName, p.department].filter(Boolean).join(" / ") ||
                            p.email}
                        </p>
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] ${invite.className}`}>
                          {invite.label}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <DoneMark done={p.preSurveyDone} />
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        {p.profileSlideDone ? (
                          <Link
                            href={`/admin/participants/${p.id}`}
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            開く
                          </Link>
                        ) : (
                          <DoneMark done={false} />
                        )}
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <AttendanceToggle
                          value={p.attendanceDay1}
                          disabled={saving}
                          onChange={(v) => handleAttendance(p.id, { attendanceDay1: v })}
                        />
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <AttendanceToggle
                          value={p.attendanceDay2}
                          disabled={saving}
                          onChange={(v) => handleAttendance(p.id, { attendanceDay2: v })}
                        />
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                          {p.completedPhases.length}/5
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">
                        {formatTime(p.lastUpdated)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.print()}
          className="text-xs"
        >
          名簿を印刷 / PDF
        </Button>
      </div>
    </div>
  );
}
