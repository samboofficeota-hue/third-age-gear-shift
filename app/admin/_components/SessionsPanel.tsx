"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatDate,
  toDateInputValue,
  type Facilitator,
  type SessionInfo,
} from "../types";

/** 研修セッション管理（A-4 / S-4・S-5）。研修コード・日程・会場・担当講師。 */

type SessionFormValues = {
  name: string;
  code: string;
  day1Date: string;
  day2Date: string;
  location: string;
  isOnline: boolean;
  facilitatorId: string;
};

const EMPTY_FORM: SessionFormValues = {
  name: "",
  code: "",
  day1Date: "",
  day2Date: "",
  location: "",
  isOnline: false,
  facilitatorId: "",
};

function toFormValues(s: SessionInfo): SessionFormValues {
  return {
    name: s.name ?? "",
    code: s.code,
    day1Date: toDateInputValue(s.day1Date),
    day2Date: toDateInputValue(s.day2Date),
    location: s.location ?? "",
    isOnline: s.isOnline,
    facilitatorId: s.facilitatorId ?? "",
  };
}

function SessionFields({
  values,
  onChange,
  facilitators,
  disableCode,
}: {
  values: SessionFormValues;
  onChange: (patch: Partial<SessionFormValues>) => void;
  facilitators: Facilitator[];
  disableCode?: boolean;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label>セッション名（任意）</Label>
        <Input
          value={values.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="例: 2026年2月 第1回"
        />
      </div>

      {!disableCode && (
        <div className="space-y-2">
          <Label>
            研修コード <span className="text-destructive">*</span>
          </Label>
          <Input
            value={values.code}
            onChange={(e) => onChange({ code: e.target.value })}
            className="font-mono"
            placeholder="例: 3rdage0201"
            autoCapitalize="none"
            required
          />
          <p className="text-xs text-muted-foreground">
            英数字・ハイフン・アンダースコア、4〜32文字
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Day 1 日程</Label>
          <Input
            type="date"
            value={values.day1Date}
            onChange={(e) => onChange({ day1Date: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Day 2 日程</Label>
          <Input
            type="date"
            value={values.day2Date}
            onChange={(e) => onChange({ day2Date: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>開催形式・会場</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={values.isOnline ? "outline" : "default"}
            onClick={() => onChange({ isOnline: false })}
          >
            対面
          </Button>
          <Button
            type="button"
            size="sm"
            variant={values.isOnline ? "default" : "outline"}
            onClick={() => onChange({ isOnline: true })}
          >
            オンライン
          </Button>
        </div>
        <Input
          value={values.location}
          onChange={(e) => onChange({ location: e.target.value })}
          placeholder={values.isOnline ? "Meet / Zoom のURL" : "会場名・住所"}
        />
      </div>

      <div className="space-y-2">
        <Label>担当講師</Label>
        <select
          value={values.facilitatorId}
          onChange={(e) => onChange({ facilitatorId: e.target.value })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">（未割り当て）</option>
          {facilitators.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name ?? f.email}
            </option>
          ))}
        </select>
        {facilitators.length === 0 && (
          <p className="text-xs text-muted-foreground">
            講師アカウント（role=facilitator）がまだ登録されていません。
          </p>
        )}
      </div>
    </>
  );
}

export function SessionsPanel({
  sessions,
  facilitators,
  selectedSessionId,
  canManage,
  onCreated,
  onUpdated,
  onSwitchSession,
}: {
  sessions: SessionInfo[];
  facilitators: Facilitator[];
  selectedSessionId: string;
  /** 作成・編集は事務局（admin）のみ。講師は閲覧と管理対象の切り替えだけ。 */
  canManage: boolean;
  onCreated: (session: SessionInfo) => void;
  onUpdated: (session: SessionInfo) => void;
  onSwitchSession: (id: string) => void;
}) {
  const [createForm, setCreateForm] = useState<SessionFormValues>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<SessionFormValues>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const patchCreate = (patch: Partial<SessionFormValues>) =>
    setCreateForm((f) => ({ ...f, ...patch }));
  const patchEdit = (patch: Partial<SessionFormValues>) =>
    setEditForm((f) => ({ ...f, ...patch }));

  const createSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);
    try {
      const res = await fetch("/api/admin/sessions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name || undefined,
          code: createForm.code,
          day1Date: createForm.day1Date || null,
          day2Date: createForm.day2Date || null,
          location: createForm.location,
          isOnline: createForm.isOnline,
          facilitatorId: createForm.facilitatorId || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCreateError(data.error ?? "作成に失敗しました。");
        return;
      }
      onCreated(data.session);
      setCreateForm(EMPTY_FORM);
    } finally {
      setCreating(false);
    }
  };

  const saveSession = async (id: string) => {
    setEditError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/sessions", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          name: editForm.name,
          day1Date: editForm.day1Date || null,
          day2Date: editForm.day2Date || null,
          location: editForm.location,
          isOnline: editForm.isOnline,
          facilitatorId: editForm.facilitatorId || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setEditError(data.error ?? "更新に失敗しました。");
        return;
      }
      onUpdated(data.session);
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    const res = await fetch("/api/admin/sessions", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) onUpdated(data.session);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="admin-page-title">セッション管理</h1>
        <p className="admin-page-note">
          {canManage
            ? "研修コード・日程・会場・担当講師を管理します。担当講師を割り当てると、その講師は自分の担当セッションだけを見られるようになります。"
            : "あなたが担当する研修セッションです。内容の変更は事務局が行います。"}
        </p>
      </div>

      {canManage && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-sm">新しいセッションを作成</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createSession} className="space-y-4">
              <SessionFields
                values={createForm}
                onChange={patchCreate}
                facilitators={facilitators}
              />
              {createError && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {createError}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? "作成中..." : "セッションを作成"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {sessions.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">既存のセッション</CardTitle>
          </CardHeader>
          <div className="divide-y">
            {sessions.map((s) => {
              const isEditing = editingId === s.id;
              return (
                <div key={s.id} className="px-6 py-4">
                  <div className="flex items-start gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {s.id === selectedSessionId && (
                          <Badge className="px-1.5 py-0 text-[9px]">管理中</Badge>
                        )}
                        <p className="text-sm font-medium">{s.name ?? "（名前なし）"}</p>
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2">
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{s.code}</code>
                        <span className="text-xs text-muted-foreground">
                          受講生 {s.participantCount} 名
                        </span>
                      </div>
                      <div className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
                        <p>
                          Day1 {formatDate(s.day1Date)} ／ Day2 {formatDate(s.day2Date)}
                        </p>
                        <p>
                          {s.isOnline ? "オンライン" : "対面"}
                          {s.location ? ` · ${s.location}` : ""}
                        </p>
                        <p>担当講師：{s.facilitatorName ?? "未割り当て"}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      {canManage && (
                        <>
                          <Button
                            size="sm"
                            variant={s.isActive ? "secondary" : "outline"}
                            className="h-7 text-xs"
                            onClick={() => toggleActive(s.id, !s.isActive)}
                          >
                            {s.isActive ? "有効" : "無効"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => {
                              setEditError(null);
                              setEditingId(isEditing ? null : s.id);
                              setEditForm(toFormValues(s));
                            }}
                          >
                            {isEditing ? "閉じる" : "編集"}
                          </Button>
                        </>
                      )}
                      {s.id !== selectedSessionId && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 border-primary/30 text-xs text-primary hover:bg-primary/5"
                          onClick={() => onSwitchSession(s.id)}
                        >
                          管理する
                        </Button>
                      )}
                    </div>
                  </div>

                  {isEditing && (
                    <div className="mt-4 space-y-4 rounded-lg border bg-muted/30 p-4">
                      <SessionFields
                        values={editForm}
                        onChange={patchEdit}
                        facilitators={facilitators}
                        disableCode
                      />
                      {editError && (
                        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                          {editError}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={saving}
                          onClick={() => saveSession(s.id)}
                        >
                          {saving ? "保存中..." : "保存する"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(null)}
                        >
                          キャンセル
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
