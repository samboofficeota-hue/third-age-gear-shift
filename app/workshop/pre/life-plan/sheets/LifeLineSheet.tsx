"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Plus, Check, Trash2 } from "lucide-react";
import { PrintSheet } from "@/components/worksheet/PrintSheet";
import { SheetHeader } from "@/components/worksheet/SheetHeader";
import { LifeLineChart } from "@/components/worksheet/LifeLineChart";
import {
  EMPTY_DRAFT,
  SCORE_MAX,
  SCORE_MIN,
  TITLE_MAX_LENGTH,
  clampAge,
  clampScore,
  sortedForChart,
  type LifeCurvePoint,
} from "../_types";

/**
 * ライフラインチャート：1シート構成。
 * チャートはフルワイドをメインに据え、画面下のコンパクトな1行の入力バーで
 * 年齢・トピック・点数を登録する（SukiTokuiMatrix と同じ登録/編集の考え方）。
 * チャート上の既存プロットをクリックすると編集モードになり、入力バーに読み込まれる。
 */
export function LifeLineSheet({
  rightSlot,
  points,
  onChange,
}: {
  rightSlot: ReactNode;
  points: LifeCurvePoint[];
  onChange: (next: LifeCurvePoint[]) => void;
}) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<LifeCurvePoint>(EMPTY_DRAFT);

  const editing = editingIndex !== null && editingIndex < points.length;
  const current = editing ? points[editingIndex as number] : draft;

  const setField = (patch: Partial<LifeCurvePoint>) => {
    if (editing) {
      onChange(points.map((p, i) => (i === editingIndex ? { ...p, ...patch } : p)));
    } else {
      setDraft((d) => ({ ...d, ...patch }));
    }
  };

  const canAdd = draft.age != null && draft.title.trim().length > 0;

  const add = () => {
    if (!canAdd) return;
    onChange([...points, { ...draft, title: draft.title.trim() }]);
    setDraft(EMPTY_DRAFT);
  };
  const startEdit = (i: number) => setEditingIndex(i);
  const finishEdit = () => {
    setEditingIndex(null);
    setDraft(EMPTY_DRAFT);
  };
  const remove = (i: number) => {
    if (!window.confirm("この点を削除しますか？")) return;
    onChange(points.filter((_, idx) => idx !== i));
    finishEdit();
  };

  const chartPoints = sortedForChart(points);

  return (
    <PrintSheet>
      <SheetHeader accent="ライフライン" title="・チャートを書いてみよう" right={rightSlot} />

      <p className="mt-3 truncate text-sm text-ws-muted">
        私の人生の「節目」を、その時の感情とセットで書き出してみよう。キャリア後半戦を考える大切な土台となります。
      </p>

      {/* ── チャート表示（フルワイド・印刷対象） ── */}
      <div className="mt-4 w-full">
        <LifeLineChart points={chartPoints} onPointClick={startEdit} />
      </div>

      {/* ── 入力バー（1行・印刷されない） ── */}
      <div className="no-print mt-6 flex items-end gap-3 rounded-xl border border-ws-line bg-ws-fill p-4">
        {editing && (
          <span className="mb-2 shrink-0 rounded bg-ws-mint px-2 py-0.5 text-[11px] font-semibold text-ws-teal">
            編集中
          </span>
        )}

        <label className="w-24 shrink-0">
          <span className="mb-1 block whitespace-nowrap text-xs font-semibold text-ws-teal">年齢（半角）</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={2}
            value={current.age ?? ""}
            onChange={(e) => {
              const digits = e.target.value.replace(/[^0-9]/g, "");
              setField({ age: digits === "" ? null : clampAge(Number(digits)) });
            }}
            placeholder="歳"
            className="w-full rounded-md border border-ws-line px-2 py-1.5 text-center text-sm text-ws-ink outline-none focus:border-ws-teal"
          />
        </label>

        <label className="w-[380px] shrink-0">
          <span className="mb-1 block text-xs font-semibold text-ws-teal">
            トピック（{TITLE_MAX_LENGTH}字以内）
          </span>
          <input
            type="text"
            value={current.title}
            onChange={(e) => setField({ title: e.target.value.slice(0, TITLE_MAX_LENGTH) })}
            maxLength={TITLE_MAX_LENGTH}
            placeholder="例：転職、結婚"
            className="w-full rounded-md border border-ws-line px-3 py-1.5 text-sm text-ws-ink outline-none focus:border-ws-teal"
          />
        </label>

        <label className="w-44 shrink-0">
          <span className="mb-1 flex items-center justify-between text-xs font-semibold text-ws-teal">
            <span>点数</span>
            <span className="font-bold text-ws-teal">{current.score > 0 ? `+${current.score}` : current.score}</span>
          </span>
          <input
            type="range"
            min={SCORE_MIN}
            max={SCORE_MAX}
            step={1}
            value={current.score}
            onChange={(e) => setField({ score: clampScore(Number(e.target.value)) })}
            className="w-full accent-ws-teal"
          />
        </label>

        {editing ? (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={finishEdit}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-ws-teal px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
            >
              <Check className="h-4 w-4" />
              編集を終える
            </button>
            <button
              type="button"
              onClick={() => remove(editingIndex as number)}
              aria-label="この点を削除"
              className="flex items-center justify-center rounded-lg border border-ws-line px-3 text-ws-muted hover:border-ws-accent hover:text-ws-accent"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={add}
            disabled={!canAdd}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-ws-teal px-4 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
            登録する
          </button>
        )}
      </div>
    </PrintSheet>
  );
}
