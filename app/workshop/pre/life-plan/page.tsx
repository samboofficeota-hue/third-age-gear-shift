"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { WorksheetStage } from "@/components/worksheet/WorksheetStage";
import { Button } from "@/components/ui/button";
import { LifeLineSheet } from "./sheets/LifeLineSheet";
import { normalizePoints, type LifeCurvePoint } from "./_types";

/**
 * ライフラインチャート（事前課題）オーケストレーター。
 * WorkshopData.pre.lifeCurve の load / save。
 */
export default function LifePlanPage() {
  const [points, setPoints] = useState<LifeCurvePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const router = useRouter();
  // ページ最後の「保存して次へ」が見えている間は、右下の浮かぶボタンを隠す（重複とフッターへの重なりを避ける）
  const nextBarRef = useRef<HTMLDivElement>(null);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await fetch("/api/workshop/me", { credentials: "include" })
        .then((r) => r.json())
        .catch(() => ({}));
      const lc = data?.workshopData?.pre?.lifeCurve as { points?: LifeCurvePoint[] } | undefined;
      setPoints(normalizePoints(lc?.points));
      setLoading(false);
    })();
  }, []);

  // 右下の「保存する」＝保存のみ（画面はそのまま）。
  // ページ下の「保存して次へ」＝保存できたら事前課題トップへ（次の課題が光っている）。
  const save = async ({ andNext = false }: { andNext?: boolean } = {}) => {
    setSaving(true);
    setSaved(false);
    setSaveError(null);
    try {
      const res = await fetch("/api/workshop/me/pre", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ lifeCurve: { points } }),
      });
      if (res.ok) {
        setSaved(true);
        if (andNext) {
          router.push("/workshop/pre");
          router.refresh();
          return;
        }
        setSaving(false);
        return;
      }
      const body = await res.json().catch(() => ({}));
      setSaveError(body.error ?? "保存できませんでした。時間をおいてもう一度お試しください。");
    } catch {
      setSaveError("保存できませんでした。通信状況をご確認ください。");
    }
    setSaving(false);
  };

  // 「保存しました ✓」は3秒で自動的に消す
  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 3000);
    return () => clearTimeout(t);
  }, [saved]);

  useEffect(() => {
    const el = nextBarRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setAtEnd(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [loading]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  const preTag = <span className="text-sm font-semibold text-ws-teal">事前課題</span>;

  return (
    <WorksheetStage>
      <LifeLineSheet
        rightSlot={preTag}
        points={points}
        onChange={(p) => {
          setPoints(p);
          setSaved(false);
        }}
      />

      {/* ページ最後：保存して次へ（事前課題トップへ戻り、次の課題に進む） */}
      <div ref={nextBarRef} className="no-print flex w-full max-w-[1100px] justify-end">
        <Button onClick={() => save({ andNext: true })} disabled={saving}>
          保存して次へ
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* 右下に浮かぶ保存ボタン（Day1・Day2 と同じ位置）。保存のみで画面は移らない */}
      <div className="no-print fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {saveError && (
          <span className="max-w-xs rounded-lg bg-white/95 px-3 py-1.5 text-sm font-medium text-destructive shadow-md ring-1 ring-ws-line">
            {saveError}
          </span>
        )}
        <div className="flex items-center gap-3">
          {saved && (
            <span className="rounded-full bg-white/95 px-3 py-1.5 text-sm font-medium text-ws-teal shadow-md ring-1 ring-ws-line">
              保存しました ✓
            </span>
          )}
          {!atEnd && (
            <Button onClick={() => save()} disabled={saving} className="rounded-full px-6 shadow-lg">
              {saving ? "保存中..." : "保存する"}
            </Button>
          )}
        </div>
      </div>
    </WorksheetStage>
  );
}
