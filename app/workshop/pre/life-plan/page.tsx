"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { WorksheetStage } from "@/components/worksheet/WorksheetStage";
import { PrintButton } from "@/components/worksheet/PrintButton";
import { Button } from "@/components/ui/button";
import { LifeLineSheet } from "./sheets/LifeLineSheet";
import { normalizePoints, type LifeCurvePoint } from "./_types";

/**
 * ライフラインチャート（事前課題・任意）オーケストレーター。
 * WorkshopData.pre.lifeCurve の load / save。
 * 「入力を完了する」で保存し、事前課題トップへ戻る。
 */
export default function LifePlanPage() {
  const router = useRouter();
  const [points, setPoints] = useState<LifeCurvePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);

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

  const finish = async () => {
    setFinishing(true);
    try {
      const res = await fetch("/api/workshop/me/pre", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ lifeCurve: { points } }),
      });
      if (res.ok) {
        router.push("/workshop/pre");
        return;
      }
    } finally {
      setFinishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  const preTag = <span className="text-sm font-semibold text-ws-teal">事前課題・任意</span>;

  return (
    <WorksheetStage>
      {/* 操作バー（印刷されない） */}
      <div className="no-print flex w-full max-w-[1123px] items-center justify-between gap-3">
        <Link
          href="/workshop/pre/profile-slide"
          className="text-sm text-ws-muted transition-colors hover:text-ws-teal"
        >
          ← 自己紹介シートへ戻る
        </Link>
        <div className="flex items-center gap-2">
          <PrintButton />
          <Button onClick={finish} disabled={finishing}>
            {finishing ? "保存中..." : "入力を完了する"}
          </Button>
        </div>
      </div>

      <LifeLineSheet rightSlot={preTag} points={points} onChange={setPoints} />
    </WorksheetStage>
  );
}
