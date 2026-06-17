"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * コミュニティ・ポートフォリオ。
 * 左＝サイドメニュー（入力・印刷されない）／右＝固定サイズの横長フレーム（表示・印刷対象）。
 * 種類ごとに象限へ引き寄せつつ、円どうしは重ならないよう自動配置（バブル図）。
 */

export type CircleType = "family" | "work" | "gift" | "learning" | "other";
export type PortfolioCircle = {
  type: CircleType;
  title: string;
  description?: string;
  size: number; // 1〜7
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

const MAX = 10;
const MAX_SIZE = 7;
const DEFAULT_SIZE = 4;

// フレームは固定サイズ（画面・印刷で同じ＝円の位置がずれない）
const FRAME_W = 660;
const FRAME_H = 430;

// 種類ごとの象限中心（フレームに対する割合）
const CENTERS: Record<CircleType, [number, number]> = {
  family: [0.26, 0.3],
  work: [0.74, 0.3],
  gift: [0.26, 0.74],
  learning: [0.74, 0.74],
  other: [0.5, 0.52],
};

/** size(1〜7) → 直径(px)。最大は従来(112)の約130%。 */
function diameter(size: number): number {
  const s = Math.max(1, Math.min(MAX_SIZE, size));
  return 48 + (s - 1) * 16; // 48〜144px
}

/** 象限へ引き寄せ＋衝突回避でバブル配置を計算（決定的） */
function computeLayout(circles: PortfolioCircle[]) {
  const nodes = circles.map((c, i) => {
    const [fx, fy] = CENTERS[c.type];
    const tx = fx * FRAME_W;
    const ty = fy * FRAME_H;
    const a = i * 2.399; // 黄金角で初期分散
    return {
      r: diameter(c.size) / 2,
      tx,
      ty,
      x: tx + Math.cos(a) * 28,
      y: ty + Math.sin(a) * 28,
    };
  });

  for (let it = 0; it < 280; it++) {
    // 象限中心への引き寄せ（大きい円ほど強い＝象限どおりに居座る）
    for (const n of nodes) {
      const k = Math.min(0.15, 0.04 * (n.r / 24));
      n.x += (n.tx - n.x) * k;
      n.y += (n.ty - n.y) * k;
    }
    // 衝突回避（重なったら押し合う）
    for (let a = 0; a < nodes.length; a++) {
      for (let b = a + 1; b < nodes.length; b++) {
        const A = nodes[a];
        const B = nodes[b];
        const dx = B.x - A.x;
        const dy = B.y - A.y;
        const dist = Math.hypot(dx, dy) || 0.01;
        const min = A.r + B.r + 5;
        if (dist < min) {
          const push = (min - dist) / 2;
          const ux = dx / dist;
          const uy = dy / dist;
          A.x -= ux * push;
          A.y -= uy * push;
          B.x += ux * push;
          B.y += uy * push;
        }
      }
    }
    // 枠内に収める
    for (const n of nodes) {
      n.x = Math.max(n.r + 3, Math.min(FRAME_W - n.r - 3, n.x));
      n.y = Math.max(n.r + 3, Math.min(FRAME_H - n.r - 3, n.y));
    }
  }
  return nodes.map((n) => ({ x: n.x, y: n.y, r: n.r }));
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
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<PortfolioCircle>(NEW_DRAFT);

  const editing = editingIndex !== null && editingIndex < value.length;
  const current = editing ? value[editingIndex as number] : draft;

  const positions = useMemo(() => computeLayout(value), [value]);

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

  return (
    <div className="mt-6 flex gap-8 print:justify-center">
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
              <span className="text-ws-teal">
                {current.size} / {MAX_SIZE}
              </span>
            </span>
            <input
              type="range"
              min={1}
              max={MAX_SIZE}
              value={Math.min(MAX_SIZE, current.size)}
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

      {/* ── 表示エリア（固定サイズの横長フレーム・印刷対象） ── */}
      <div className="shrink-0">
        <div
          className="relative overflow-hidden rounded-xl border-2 border-ws-line bg-white"
          style={{ width: FRAME_W, height: FRAME_H }}
        >
          {/* 象限ラベル（背景色なし） */}
          <span className="absolute left-3 top-2 text-xs font-bold text-[#3B82F6]">
            家庭
          </span>
          <span className="absolute right-3 top-2 text-xs font-bold text-[#E5277E]">
            仕事
          </span>
          <span className="absolute bottom-2 left-3 text-xs font-bold text-[#9A6A3C]">
            ギフト
          </span>
          <span className="absolute bottom-2 right-3 text-xs font-bold text-[#22A06B]">
            学び
          </span>
          <span className="absolute left-1/2 top-1.5 -translate-x-1/2 text-[10px] font-bold text-ws-muted">
            その他
          </span>

          {/* 円（バブル配置） */}
          {value.map((c, i) => {
            const p = positions[i];
            const t = TYPE_BY_KEY[c.type];
            return (
              <button
                key={i}
                type="button"
                title={c.description || c.title}
                onClick={() => startEdit(i)}
                className={cn(
                  "absolute flex items-center justify-center rounded-full text-center text-white shadow-sm transition-shadow hover:shadow-md",
                  editingIndex === i && "z-10 ring-2 ring-ws-ink ring-offset-1"
                )}
                style={{
                  left: p.x - p.r,
                  top: p.y - p.r,
                  width: p.r * 2,
                  height: p.r * 2,
                  backgroundColor: t.color,
                }}
              >
                <span className="px-1.5 text-[11px] font-medium leading-tight line-clamp-3">
                  {c.title}
                </span>
              </button>
            );
          })}
        </div>
        <p className="no-print mt-2 text-xs text-ws-muted">
          円をクリックすると編集できます。大きい円ほど、種類の象限（家庭=左上／仕事=右上／ギフト=左下／学び=右下／その他=中央）に寄ります。
        </p>
      </div>
    </div>
  );
}
