"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SurveyShell } from "@/components/survey/SurveyShell";
import { LikertScale, SingleChoice, MultiChoice } from "@/components/survey/fields";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  PRE_NENDAI,
  PRE_SCALE_SECTIONS,
  PRE_CHOICE,
  PRE_SAMPLE,
  SCALE_MIN_LABEL,
  SCALE_MAX_LABEL,
  REASON_TENSHOKU,
  REASON_KOYOU,
  CHALLENGE_CHUSHO,
  SUPPORT,
  preReasonFlags,
  pruneReasonAnswers,
  type ChoiceQuestion,
} from "@/lib/surveyContent";

type Answers = Record<string, number | string | string[]>;

export default function PreSurveyPage() {
  const [answers, setAnswers] = useState<Answers>({});
  const [mode, setMode] = useState<"edit" | "sample">("edit");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await fetch("/api/workshop/me", { credentials: "include" })
        .then((r) => r.json())
        .catch(() => ({}));
      const pre = data?.workshopData?.pre as { survey?: Answers } | null;
      if (pre?.survey) setAnswers(pre.survey);
      setLoading(false);
    })();
  }, []);

  const isSample = mode === "sample";
  const view: Answers = isSample ? PRE_SAMPLE : answers;

  const setScale = (key: string, v: number) => {
    if (isSample) return;
    setAnswers((a) => ({ ...a, [key]: v }));
    setSaved(false);
  };
  const setChoice = (key: string, v: string) => {
    if (isSample) return;
    setAnswers((a) => pruneReasonAnswers({ ...a, [key]: v }));
    setSaved(false);
  };
  const setMulti = (key: string, v: string[]) => {
    if (isSample) return;
    setAnswers((a) => pruneReasonAnswers({ ...a, [key]: v }));
    setSaved(false);
  };

  const renderChoice = (q: ChoiceQuestion) => (
    <section key={q.key} className="space-y-5">
      <h2 className="text-sm font-bold text-primary">{q.title}</h2>
      <SingleChoice
        label={q.text}
        options={q.options}
        value={typeof view[q.key] === "string" ? (view[q.key] as string) : null}
        onChange={(v) => setChoice(q.key, v)}
        disabled={isSample}
      />
    </section>
  );

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/workshop/me/pre", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ survey: answers }),
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
      title="事前アンケート"
      description="ご自身のキャリアについて、お伺いしていきます。（所要時間 5分程度）回答いただいた内容は匿名の形で集計されます。各設問は 1（そう思わない）〜5（そう思う）でお答えください。"
    >
      {/* 記入する / 記入例トグル */}
      <div className="flex items-center gap-2">
        {(["edit", "sample"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              mode === m
                ? "border-primary bg-primary/15 text-primary"
                : "border-[rgba(0,255,136,0.2)] text-[#a0c0b0] hover:text-[#e0f0e8]"
            )}
          >
            {m === "edit" ? "記入する" : "記入例を見る"}
          </button>
        ))}
      </div>

      {isSample && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-300">
          記入例（太田義史さん）を表示中です。回答はできません。
        </div>
      )}

      {/* 年代（属性） */}
      <section className="space-y-5">
        <h2 className="text-lg font-bold text-primary">属性</h2>
        <SingleChoice
          label={PRE_NENDAI.text}
          options={PRE_NENDAI.options}
          value={typeof view[PRE_NENDAI.key] === "string" ? (view[PRE_NENDAI.key] as string) : null}
          onChange={(v) => setChoice(PRE_NENDAI.key, v)}
          disabled={isSample}
        />
      </section>

      {/* §A〜C 5段階 */}
      {PRE_SCALE_SECTIONS.map((section) => (
        <section key={section.id} className="space-y-5">
          <h2 className="text-lg font-bold text-primary">
            §{section.id}　{section.title}
          </h2>
          {section.questions.map((q, i) => (
            <LikertScale
              key={q.key}
              label={`${i + 1}. ${q.text}`}
              minLabel={SCALE_MIN_LABEL}
              maxLabel={SCALE_MAX_LABEL}
              value={typeof view[q.key] === "number" ? (view[q.key] as number) : null}
              onChange={(v) => setScale(q.key, v)}
              disabled={isSample}
            />
          ))}
        </section>
      ))}

      {/* §D 単一選択 */}
      <section className="space-y-5">
        <h2 className="text-lg font-bold text-primary">
          §D　{PRE_CHOICE.title}
        </h2>
        <SingleChoice
          label={PRE_CHOICE.text}
          options={PRE_CHOICE.options}
          value={typeof view[PRE_CHOICE.key] === "string" ? (view[PRE_CHOICE.key] as string) : null}
          onChange={(v) => setChoice(PRE_CHOICE.key, v)}
          disabled={isSample}
        />
      </section>

      {/* §D の回答に応じた理由（図2〜5） */}
      {(() => {
        const f = preReasonFlags(view);
        return (
          <>
            {f.showTenshoku && renderChoice(REASON_TENSHOKU)}
            {f.showKoyou && renderChoice(REASON_KOYOU)}
            {f.showChusho && renderChoice(CHALLENGE_CHUSHO)}
            {f.showSupport && (
              <section className="space-y-5">
                <h2 className="text-lg font-bold text-primary">{SUPPORT.title}</h2>
                <MultiChoice
                  label={SUPPORT.text}
                  options={SUPPORT.options}
                  value={Array.isArray(view[SUPPORT.key]) ? (view[SUPPORT.key] as string[]) : []}
                  onChange={(v) => setMulti(SUPPORT.key, v)}
                  disabled={isSample}
                />
              </section>
            )}
          </>
        );
      })()}

      {/* 保存 */}
      {!isSample && (
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
      )}
    </SurveyShell>
  );
}
