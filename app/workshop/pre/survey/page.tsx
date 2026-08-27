"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SurveyShell } from "@/components/survey/SurveyShell";
import { LikertScale, SingleChoice, MultiChoice } from "@/components/survey/fields";
import { Button } from "@/components/ui/button";
import {
  PRE_NENDAI,
  PRE_SCALE_SECTIONS,
  PRE_CHOICE,
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

  const view: Answers = answers;

  const setScale = (key: string, v: number) => {
    setAnswers((a) => ({ ...a, [key]: v }));
    setSaved(false);
  };
  const setChoice = (key: string, v: string) => {
    setAnswers((a) => pruneReasonAnswers({ ...a, [key]: v }));
    setSaved(false);
  };
  const setMulti = (key: string, v: string[]) => {
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
      description={
        <>
          まず、キャリアについて、お考えを教えてください。（所要時間 5分程度）
          <br />
          回答いただいた内容は、個人が特定できない形で集計されます。
        </>
      }
    >
      {/* 年代（属性） */}
      <section className="space-y-5">
        <h2 className="text-lg font-bold text-primary">属性</h2>
        <SingleChoice
          label={PRE_NENDAI.text}
          options={PRE_NENDAI.options}
          value={typeof view[PRE_NENDAI.key] === "string" ? (view[PRE_NENDAI.key] as string) : null}
          onChange={(v) => setChoice(PRE_NENDAI.key, v)}
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
                />
              </section>
            )}
          </>
        );
      })()}

      {/* 保存 */}
      <div className="flex items-center gap-3 pt-2">
        {saved ? (
          <>
            <span className="text-sm text-primary">保存しました ✓</span>
            <Button asChild className="ml-auto">
              <Link href="/workshop/pre">
                事前課題へ戻る
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </>
        ) : (
          <>
            <Link
              href="/workshop/pre"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              事前課題へ戻る
            </Link>
            <Button onClick={save} disabled={saving} className="ml-auto">
              {saving ? "保存中..." : "保存する"}
            </Button>
          </>
        )}
      </div>
    </SurveyShell>
  );
}
