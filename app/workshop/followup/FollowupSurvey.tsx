"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SurveyShell } from "@/components/survey/SurveyShell";
import { LikertScale, SurveyTextArea } from "@/components/survey/fields";
import { Button } from "@/components/ui/button";
import {
  FOLLOWUP_SOCIETY,
  FOLLOWUP_COMPANY,
  FOLLOWUP_SCALE,
  SCALE_MIN_LABEL,
  SCALE_MAX_LABEL,
} from "@/lib/surveyContent";

type Answers = Record<string, number | string>;

export function FollowupSurvey() {
  const [answers, setAnswers] = useState<Answers>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await fetch("/api/workshop/me", { credentials: "include" })
        .then((r) => r.json())
        .catch(() => ({}));
      const post = data?.workshopData?.post as { survey3mo?: Answers } | null;
      if (post?.survey3mo) setAnswers(post.survey3mo);
      setLoading(false);
    })();
  }, []);

  const setScale = (key: string, v: number) => {
    setAnswers((a) => ({ ...a, [key]: v }));
    setSaved(false);
  };
  const setText = (key: string, v: string) => {
    setAnswers((a) => ({ ...a, [key]: v }));
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/workshop/me/post", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ survey3mo: answers }),
      });
      if (res.ok) setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  return (
    <SurveyShell
      title="近況のお伺い"
      description={
        <>
          研修から 3 ヶ月。あれから、いかがお過ごしでしょうか？
          <br />
          研修で書いた「社会」「会社」のテーマについて、実際の動きを少しだけ振り返ってみてください。
          <br />
          所要時間 約3分
        </>
      }
    >
      {/* 社会編 自由記述 */}
      <section className="space-y-5">
        <SurveyTextArea
          label={FOLLOWUP_SOCIETY.label}
          hint={FOLLOWUP_SOCIETY.hint}
          placeholder={FOLLOWUP_SOCIETY.placeholder}
          rows={5}
          value={
            typeof answers[FOLLOWUP_SOCIETY.key] === "string"
              ? (answers[FOLLOWUP_SOCIETY.key] as string)
              : ""
          }
          onChange={(v) => setText(FOLLOWUP_SOCIETY.key, v)}
        />
      </section>

      {/* 会社編 自由記述 */}
      <section className="space-y-5">
        <SurveyTextArea
          label={FOLLOWUP_COMPANY.label}
          hint={FOLLOWUP_COMPANY.hint}
          placeholder={FOLLOWUP_COMPANY.placeholder}
          rows={5}
          value={
            typeof answers[FOLLOWUP_COMPANY.key] === "string"
              ? (answers[FOLLOWUP_COMPANY.key] as string)
              : ""
          }
          onChange={(v) => setText(FOLLOWUP_COMPANY.key, v)}
        />
      </section>

      {/* 5段階リッカート */}
      <section className="space-y-5">
        <h2 className="text-lg font-bold text-primary">
          §{FOLLOWUP_SCALE.id}　{FOLLOWUP_SCALE.title}
        </h2>
        {FOLLOWUP_SCALE.questions.map((q, i) => (
          <LikertScale
            key={q.key}
            label={`${i + 1}. ${q.text}`}
            minLabel={SCALE_MIN_LABEL}
            maxLabel={SCALE_MAX_LABEL}
            value={
              typeof answers[q.key] === "number"
                ? (answers[q.key] as number)
                : null
            }
            onChange={(v) => setScale(q.key, v)}
          />
        ))}
      </section>

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
