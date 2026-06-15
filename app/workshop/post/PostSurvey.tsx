"use client";

import { useState } from "react";
import Link from "next/link";
import { SurveyShell } from "@/components/survey/SurveyShell";
import { LikertScale, SurveyTextArea } from "@/components/survey/fields";
import { Button } from "@/components/ui/button";

/**
 * 事後アンケート（プレースホルダ）。レスポンシブ。
 * PHASE_B: §A〜D共通＋§E研修評価 の確定設問に差し替える。
 */
export function PostSurvey() {
  const [q1, setQ1] = useState<number | null>(null);
  const [free, setFree] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/workshop/me/post", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ surveyImmediate: { q1, free } }),
      });
      if (res.ok) setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SurveyShell
      title="事後アンケート"
      description="研修お疲れさまでした。所要約5分。（※設問は仮置きです）"
    >
      <LikertScale
        label="（仮）研修全体の満足度"
        minLabel="低い"
        maxLabel="高い"
        value={q1}
        onChange={setQ1}
      />
      <SurveyTextArea
        label="（仮）研修を通じて気づいたこと・これからやってみようと思ったこと"
        value={free}
        onChange={setFree}
      />
      <div className="flex items-center gap-3 pt-2">
        <Button onClick={save} disabled={saving}>
          {saving ? "保存中..." : "保存する"}
        </Button>
        {saved && <span className="text-sm text-primary">保存しました ✓</span>}
        <Link
          href="/workshop"
          className="ml-auto text-sm text-muted-foreground hover:text-[#e0f0e8]"
        >
          ダッシュボードへ
        </Link>
      </div>
    </SurveyShell>
  );
}
