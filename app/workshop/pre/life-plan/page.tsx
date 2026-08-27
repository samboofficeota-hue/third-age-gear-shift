"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/workshop/me/pre", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ lifeCurve: { points } }),
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

      <div className="no-print flex w-full max-w-[1123px] items-center gap-3">
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
    </WorksheetStage>
  );
}
