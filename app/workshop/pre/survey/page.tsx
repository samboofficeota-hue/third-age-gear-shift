"use client";

import { useState } from "react";
import Link from "next/link";
import { SurveyShell } from "@/components/survey/SurveyShell";
import { LikertScale, SurveyTextArea } from "@/components/survey/fields";
import { Button } from "@/components/ui/button";

/**
 * 事前アンケート（プレースホルダ）。レスポンシブ確認用。
 * PHASE_B: §A〜D の確定設問（日本語ブラッシュアップ後）に差し替える。
 */
export default function PreSurveyPage() {
  const [q1, setQ1] = useState<number | null>(null);
  const [q2, setQ2] = useState<number | null>(null);
  const [free, setFree] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/workshop/me/pre", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ survey: { q1, q2, free } }),
      });
      if (res.ok) setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SurveyShell
      title="事前アンケート"
      description="所要約5分。会社へは匿名の集計のみが共有され、個人の回答は共有されません。（※設問は仮置きです）"
    >
      <LikertScale
        label="（仮）自分のキャリアは、会社任せではなく自分で考えて作るものだと思う"
        value={q1}
        onChange={setQ1}
      />
      <LikertScale
        label="（仮）今後のキャリアについて、具体的に考える時間を定期的に持っている"
        value={q2}
        onChange={setQ2}
      />
      <SurveyTextArea
        label="（仮）自由記述"
        value={free}
        onChange={setFree}
        placeholder="ここに記入"
      />

      <div className="flex items-center gap-3 pt-2">
        <Button onClick={save} disabled={saving}>
          {saving ? "保存中..." : "保存する"}
        </Button>
        {saved && <span className="text-sm text-primary">保存しました ✓</span>}
        <Link
          href="/workshop/pre"
          className="ml-auto text-sm text-muted-foreground hover:text-[#e0f0e8]"
        >
          事前課題へ戻る
        </Link>
      </div>
    </SurveyShell>
  );
}
