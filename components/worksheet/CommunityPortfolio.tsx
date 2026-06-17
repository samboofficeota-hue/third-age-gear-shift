"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * コミュニティ・ポートフォリオ。
 * 左＝サイドメニュー（入力・印刷されない）／右＝横長フレーム（表示・印刷対象）。
 * 種類ごとに象限を固定（家庭=左上/仕事=右上/ギフト=左下/学び=右下/その他=中央）。
 */

export type CircleType = "family" | "work" | "gift" | "learning" | "other";
export type PortfolioCircle = {
  type: CircleType;
  title: string;
  description?: string;
  size: number; // 1〜10
};

const TYPES: { key: CircleType; label: string; color: string }[] = [
  { key: "family", label: "家庭", color: "#3B82F6" },
  { key: "work", label: "仕事", color: "#E5277E" },
  { key: "gift", label: "ギフト", color: "#9A6A3C" },
  { key: "learning", label: "学び", color: "#22A06B" },
  { key: "other", label: "その他", color: "#6B7280" },
];
const TYPE_BY_KEY = Object.fromEntries(TYPES.map((t) => [t.key, t])) as Record<
  CircleType,
  (typeof TYPES)[number]
>;

const QUADRANTS: CircleType[] = ["family", "work", "gift", "learning"];
const MAX = 10;
const DEFAULT_SIZE = 5;

function diameter(size: number): number {
  return 40 + (Math.max(1, Math.min(10, size)) - 1) * 8; // 40〜112px
}

function Circle({
  c,
  selected,
  onClick,
}: {
  c: PortfolioCircle;
  selected?: boolean;
  onClick?: () => void;
}) {
  const t = TYPE_BY_KEY[c.type];
  const d = diameter(c.size);
  return (
    <button
      type="button"
      title={c.description || c.title}
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full text-center text-white shadow-sm transition-shadow hover:shadow-md",
        selected && "ring-2 ring-ws-ink ring-offset-2"
      )}
      style={{ width: d, height: d, backgroundColor: t.color }}
    >
      <span className="px-1.5 text-[11px] font-medium leading-tight line-clamp-3">
        {c.title}
      </span>
    </button>
  );
}

const NEW_DRAFT: PortfolioCircle = {
  type: "work",
  title: "",
  description: "",
  size: DEFAULT_SIZE,
};

export function CommunityPortfolio({
  value,
  onChange,
}: {
  value: PortfolioCircle[];
  onChange: (next: PortfolioCircle[]) => void;
}) {
  // editingIndex=null → 新規追加 ／ 数値 → その円をライブ編集
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<PortfolioCircle>(NEW_DRAFT);

  const editing = editingIndex !== null && editingIndex < value.length;
  const current = editing ? value[editingIndex as number] : draft;

  const setField = (patch: Partial<PortfolioCircle>) => {
    if (editing) {
      onChange(
        value.map((c, i) => (i === editingIndex ? { ...c, ...patch } : c))
      );
    } else {
      setDraft((d) => ({ ...d, ...patch }));
    }
  };

  const add = () => {
    if (!draft.title.trim() || value.length >= MAX) return;
    onChange([...value, { ...draft, title: draft.title.trim() }]);
    setDraft(NEW_DRAFT);
  };

  const startEdit = (i: number) => setEditingIndex(i);
  const finishEdit = () => {
    setEditingIndex(null);
    setDraft(NEW_DRAFT);
  };

  const remove = (i: number) => {
    if (!window.confirm(`「${value[i].title || "無題"}」を削除しますか？`)) return;
    onChange(value.filter((_, idx) => idx !== i));
    if (editingIndex === i) finishEdit();
    else if (editingIndex !== null && i < editingIndex)
      setEditingIndex(editingIndex - 1);
  };

  const entriesOfType = (k: CircleType) =>
    value.map((c, i) => ({ c, i })).filter((e) => e.c.type === k);

  return (
    <div className="mt-6 flex gap-8">
      {/* ── サイドメニュー（印刷されない） ── */}
      <div className="no-print w-[320px] shrink-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-ws-ink">コミュニティ入力</p>
          {editing && (
            <span className="rounded bg-ws-mint px-2 py-0.5 text-[11px] font-semibold text-ws-teal">
              編集中
            </span>
          )}
        </div>

        <div className="mt-3 space-y-3">
          {/* 種類（1行・罫線=キーカラー・選択で背景色） */}
          <div>
            <span className="mb-1.5 block text-xs font-semibold text-ws-muted">
              種類
            </span>
            <div className="flex gap-1">
              {TYPES.map((t) => {
                const on = current.type === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setField({ type: t.key })}
                    className="flex-1 rounded-md border-2 px-1 py-1.5 text-xs font-semibold transition-colors"
                    style={{
                      borderColor: t.color,
                      backgroundColor: on ? t.color : "transparent",
                      color: on ? "#fff" : t.color,
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* タイトル */}
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-ws-muted">
              タイトル
            </span>
            <input
              value={current.title}
              onChange={(e) => setField({ title: e.target.value })}
              placeholder="例）PICセンターの仕事"
              className="w-full rounded-md border border-ws-line px-3 py-2 text-sm text-ws-ink outline-none focus:border-ws-teal"
            />
          </label>

          {/* 説明 */}
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-ws-muted">
              説明（円にカーソルを乗せると表示）
            </span>
            <textarea
              value={current.description ?? ""}
              onChange={(e) => setField({ description: e.target.value })}
              rows={2}
              placeholder="どんなコミュニティ／活動か"
              className="w-full resize-none rounded-md border border-ws-line px-3 py-2 text-sm text-ws-ink outline-none focus:border-ws-teal"
            />
          </label>

          {/* サイズ（編集中はライブで拡大縮小） */}
          <label className="block">
            <span className="mb-1 flex items-center justify-between text-xs font-semibold text-ws-muted">
              <span>円のサイズ</span>
              <span className="text-ws-teal">{current.size}</span>
            </span>
            <input
              type="range"
              min={1}
              max={10}
              value={current.size}
              onChange={(e) => setField({ size: Number(e.target.value) })}
              className="w-full accent-ws-teal"
            />
          </label>

          {editing ? (
            <button
              type="button"
              onClick={finishEdit}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ws-teal px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
            >
              <Check className="h-4 w-4" />
              編集を終える
            </button>
          ) : (
            <button
              type="button"
              onClick={add}
              disabled={!draft.title.trim() || value.length >= MAX}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ws-teal px-4 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
              円を追加（{value.length}/{MAX}）
            </button>
          )}
        </div>

        {/* 追加済みリスト（編集・削除） */}
        {value.length > 0 && (
          <ul className="mt-4 space-y-1 border-t border-ws-line pt-3">
            {value.map((c, i) => (
              <li
                key={i}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                  editingIndex === i && "bg-ws-mint"
                )}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: TYPE_BY_KEY[c.type].color }}
                />
                <span className="min-w-0 flex-1 truncate text-ws-ink">
                  {c.title || "無題"}
                </span>
                <button
                  type="button"
                  onClick={() => startEdit(i)}
                  className="shrink-0 text-ws-muted hover:text-ws-teal"
                  aria-label="編集"
                  title="編集"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="shrink-0 text-ws-muted hover:text-ws-accent"
                  aria-label="削除"
                  title="削除"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── 表示エリア（横長フレーム・印刷対象） ── */}
      <div className="min-w-0 flex-1">
        <div className="relative h-[440px] overflow-hidden rounded-xl border-2 border-ws-line bg-white">
          <div className="grid h-full grid-cols-2 grid-rows-2">
            {QUADRANTS.map((k) => {
              const t = TYPE_BY_KEY[k];
              return (
                <div
                  key={k}
                  className="relative flex flex-wrap content-center items-center justify-center gap-2 p-5"
                  style={{ backgroundColor: `${t.color}0f` }}
                >
                  <span
                    className="absolute left-3 top-2 text-xs font-bold"
                    style={{ color: t.color }}
                  >
                    {t.label}
                  </span>
                  {entriesOfType(k).map((e) => (
                    <Circle
                      key={e.i}
                      c={e.c}
                      selected={editingIndex === e.i}
                      onClick={() => startEdit(e.i)}
                    />
                  ))}
                </div>
              );
            })}
          </div>

          {/* 中央：その他 */}
          <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
            <span className="mb-1 text-[10px] font-bold text-ws-muted">その他</span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {entriesOfType("other").map((e) => (
                <Circle
                  key={e.i}
                  c={e.c}
                  selected={editingIndex === e.i}
                  onClick={() => startEdit(e.i)}
                />
              ))}
            </div>
          </div>
        </div>
        <p className="mt-2 text-xs text-ws-muted">
          円をクリックすると編集できます。種類ごとに象限が決まります（家庭=左上／仕事=右上／ギフト=左下／学び=右下／その他=中央）。
        </p>
      </div>
    </div>
  );
}
