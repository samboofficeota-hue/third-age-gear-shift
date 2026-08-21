"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toDateInputValue, type SessionInfo } from "../types";

/**
 * 研修（セッション）の作成・編集フォーム（S-4 / S-5）。
 * 一覧の「研修を作成」と、研修ダッシュボードの「実施情報」の両方から使う。
 * 研修コードは作成時のみ。あとから変えると受講生の紐付けが壊れるため編集不可。
 */

type Values = {
  name: string;
  code: string;
  day1Date: string;
  day2Date: string;
  location: string;
  isOnline: boolean;
};

const EMPTY: Values = {
  name: "",
  code: "",
  day1Date: "",
  day2Date: "",
  location: "",
  isOnline: false,
};

function toValues(s: SessionInfo): Values {
  return {
    name: s.name ?? "",
    code: s.code,
    day1Date: toDateInputValue(s.day1Date),
    day2Date: toDateInputValue(s.day2Date),
    location: s.location ?? "",
    isOnline: s.isOnline,
  };
}

export function SessionForm({
  session,
  onSaved,
  onCancel,
}: {
  /** 渡すと編集、渡さないと新規作成 */
  session?: SessionInfo;
  onSaved: (session: SessionInfo) => void;
  onCancel?: () => void;
}) {
  const isEdit = Boolean(session);
  const [values, setValues] = useState<Values>(session ? toValues(session) : EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const patch = (p: Partial<Values>) => {
    setValues((v) => ({ ...v, ...p }));
    setSaved(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const body = isEdit
        ? {
            id: session!.id,
            name: values.name,
            day1Date: values.day1Date || null,
            day2Date: values.day2Date || null,
            location: values.location,
            isOnline: values.isOnline,
          }
        : {
            name: values.name || undefined,
            code: values.code,
            day1Date: values.day1Date || null,
            day2Date: values.day2Date || null,
            location: values.location,
            isOnline: values.isOnline,
          };

      const res = await fetch("/api/admin/sessions", {
        method: isEdit ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? (isEdit ? "更新に失敗しました。" : "作成に失敗しました。"));
        return;
      }
      onSaved(data.session);
      setSaved(true);
      if (!isEdit) setValues(EMPTY);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-5">
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label>研修名（任意）</Label>
            <Input
              value={values.name}
              onChange={(e) => patch({ name: e.target.value })}
              placeholder="例: 2026年2月 第1回"
            />
          </div>

          {isEdit ? (
            <div className="space-y-2">
              <Label>研修コード</Label>
              <p className="font-mono text-sm text-muted-foreground">
                {session!.code}
                <span className="ml-2 font-sans text-xs">
                  （受講生の紐付けに使うため変更できません）
                </span>
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>
                研修コード <span className="text-destructive">*</span>
              </Label>
              <Input
                value={values.code}
                onChange={(e) => patch({ code: e.target.value })}
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
                onChange={(e) => patch({ day1Date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Day 2 日程</Label>
              <Input
                type="date"
                value={values.day2Date}
                onChange={(e) => patch({ day2Date: e.target.value })}
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
                onClick={() => patch({ isOnline: false })}
              >
                対面
              </Button>
              <Button
                type="button"
                size="sm"
                variant={values.isOnline ? "default" : "outline"}
                onClick={() => patch({ isOnline: true })}
              >
                オンライン
              </Button>
            </div>
            <Input
              value={values.location}
              onChange={(e) => patch({ location: e.target.value })}
              placeholder={values.isOnline ? "Meet / Zoom のURL" : "会場名・住所"}
            />
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex items-center gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "保存中..." : isEdit ? "変更を保存" : "研修を作成"}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                キャンセル
              </Button>
            )}
            {saved && isEdit && (
              <span className="text-sm text-primary">保存しました</span>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
