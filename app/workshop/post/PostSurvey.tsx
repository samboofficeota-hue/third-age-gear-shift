"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import { SurveyShell } from "@/components/survey/SurveyShell";
import {
  LikertScale,
  SingleChoice,
  MultiChoice,
  SurveyTextArea,
} from "@/components/survey/fields";
import { Button } from "@/components/ui/button";
import {
  POST_SCALE_SECTIONS,
  POST_CHOICE,
  POST_FREETEXT,
  SECTION_E,
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

export function PostSurvey() {
  const [answers, setAnswers] = useState<Answers>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await fetch("/api/workshop/me", { credentials: "include" })
        .then((r) => r.json())
        .catch(() => ({}));
      const post = data?.workshopData?.post as { surveyImmediate?: Answers } | null;
      if (post?.surveyImmediate) setAnswers(post.surveyImmediate);
      setLoading(false);
    })();
  }, []);

  const setScale = (key: string, v: number) => {
    setAnswers((a) => ({ ...a, [key]: v }));
  };
  const setChoice = (key: string, v: string) => {
    setAnswers((a) => pruneReasonAnswers({ ...a, [key]: v }));
  };
  const setMulti = (key: string, v: string[]) => {
    setAnswers((a) => pruneReasonAnswers({ ...a, [key]: v }));
  };
  const setText = (key: string, v: string) => {
    setAnswers((a) => ({ ...a, [key]: v }));
  };

  const renderChoice = (q: ChoiceQuestion) => (
    <section key={q.key} className="space-y-5">
      <h2 className="text-sm font-bold text-primary">{q.title}</h2>
      <SingleChoice
        label={q.text}
        options={q.options}
        value={typeof answers[q.key] === "string" ? (answers[q.key] as string) : null}
        onChange={(v) => setChoice(q.key, v)}
      />
    </section>
  );

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/workshop/me/post", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ surveyImmediate: answers }),
      });
      if (res.ok) setSubmitted(true);
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

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
        <p className="text-2xl font-bold text-[#e0f0e8]">
          ご回答ありがとうございました。
        </p>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          事後アンケートを送信しました。じぶん経営 戦略講座は、これで全プログラム終了です。
          お疲れさまでした。
        </p>
        <Link
          href="/workshop/records/download"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-neon-glow transition hover:bg-neon-dim"
        >
          <Download className="h-4 w-4" />
          ワーク一式をPDFでダウンロード
        </Link>
        <Link
          href="/workshop/guide"
          className="text-sm text-muted-foreground hover:text-[#e0f0e8]"
        >
          ガイドへ戻る
        </Link>
      </div>
    );
  }

  return (
    <SurveyShell
      title="事後アンケート"
      description={
        <>
          研修お疲れさまでした。事後アンケートにご協力をお願いします。
          <br />
          事前と同じ質問については、研修前後での変化を把握するためのものです。回答内容は匿名で集計されます。
          <br />
          所要時間 約5分
        </>
      }
    >
      {/* §A〜C 5段階 */}
      {POST_SCALE_SECTIONS.map((section) => (
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
              value={typeof answers[q.key] === "number" ? (answers[q.key] as number) : null}
              onChange={(v) => setScale(q.key, v)}
            />
          ))}
        </section>
      ))}

      {/* §D 単一選択 */}
      <section className="space-y-5">
        <h2 className="text-lg font-bold text-primary">
          §D　{POST_CHOICE.title}
        </h2>
        <SingleChoice
          label={POST_CHOICE.text}
          options={POST_CHOICE.options}
          value={
            typeof answers[POST_CHOICE.key] === "string"
              ? (answers[POST_CHOICE.key] as string)
              : null
          }
          onChange={(v) => setChoice(POST_CHOICE.key, v)}
        />
      </section>

      {/* §D の回答に応じた理由（図2〜5） */}
      {(() => {
        const f = preReasonFlags(answers);
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
                  value={Array.isArray(answers[SUPPORT.key]) ? (answers[SUPPORT.key] as string[]) : []}
                  onChange={(v) => setMulti(SUPPORT.key, v)}
                />
              </section>
            )}
          </>
        );
      })()}

      {/* §E 研修評価 */}
      <section className="space-y-5">
        <h2 className="text-lg font-bold text-primary">
          §{SECTION_E.id}　{SECTION_E.title}
        </h2>
        {SECTION_E.questions.map((q, i) => {
          const isNps = q.kind === "nps";
          return (
            <LikertScale
              key={q.key}
              label={`${i + 1}. ${q.text}`}
              minLabel={q.minLabel ?? SCALE_MIN_LABEL}
              maxLabel={q.maxLabel ?? SCALE_MAX_LABEL}
              min={1}
              max={isNps ? 10 : 5}
              value={typeof answers[q.key] === "number" ? (answers[q.key] as number) : null}
              onChange={(v) => setScale(q.key, v)}
            />
          );
        })}
      </section>

      {/* 自由記述 */}
      <section className="space-y-5">
        <SurveyTextArea
          label={POST_FREETEXT.label}
          hint={POST_FREETEXT.hint}
          value={typeof answers[POST_FREETEXT.key] === "string" ? (answers[POST_FREETEXT.key] as string) : ""}
          onChange={(v) => setText(POST_FREETEXT.key, v)}
        />
      </section>

      {/* 保存 */}
      <div className="flex items-center gap-3 pt-2">
        <Button onClick={save} disabled={saving}>
          {saving ? "送信中..." : "送信する"}
        </Button>
        <Link
          href="/workshop/guide"
          className="ml-auto text-sm text-muted-foreground hover:text-[#e0f0e8]"
        >
          ガイドへ戻る
        </Link>
      </div>
    </SurveyShell>
  );
}
