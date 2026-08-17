"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, Check } from "lucide-react";
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

// 選択できる種類（「その他」は選べない。既存データ互換のため型・配置マップには残す）
const TYPES: { key: CircleType; label: string; color: string }[] = [
  { key: "family", label: "家庭", color: "#3B82F6" },
  { key: "work", label: "仕事", color: "#E5277E" },
  { key: "gift", label: "ギフト", color: "#9A6A3C" },
  { key: "learning", label: "学び", color: "#22A06B" },
];
const ALL_TYPES = [...TYPES, { key: "other" as const, label: "その他", color: "#6B7280" }];
const TYPE_BY_KEY = Object.fromEntries(ALL_TYPES.map((t) => [t.key, t])) as Record<
  CircleType,
  (typeof ALL_TYPES)[number]
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
  readOnly = false,
}: {
  value: PortfolioCircle[];
  onChange?: (next: PortfolioCircle[]) => void;
  readOnly?: boolean;
}) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<PortfolioCircle>(NEW_DRAFT);

  const editing = editingIndex !== null && editingIndex < value.length;
  const current = editing ? value[editingIndex as number] : draft;

  const positions = useMemo(() => computeLayout(value), [value]);

  const setField = (patch: Partial<PortfolioCircle>) => {
    if (editing) {
      onChange?.(
        value.map((c, i) => (i === editingIndex ? { ...c, ...patch } : c))
      );
    } else {
      setDraft((d) => ({ ...d, ...patch }));
    }
  };

  const add = () => {
    if (!draft.title.trim() || value.length >= MAX) return;
    onChange?.([...value, { ...draft, title: draft.title.trim() }]);
    setDraft(NEW_DRAFT);
  };

  const startEdit = (i: number) => setEditingIndex(i);
  const finishEdit = () => {
    setEditingIndex(null);
    setDraft(NEW_DRAFT);
  };
  const remove = (i: number) => {
    onChange?.(value.filter((_, idx) => idx !== i));
    if (editingIndex === i) finishEdit();
    else if (editingIndex !== null && i < editingIndex)
      setEditingIndex(editingIndex - 1);
  };

  return (
    <div className="mt-6 flex flex-col items-center gap-4">
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

          {/* 円（バブル配置） */}
          {value.map((c, i) => {
            const p = positions[i];
            const t = TYPE_BY_KEY[c.type];
            return (
              <button
                key={i}
                type="button"
                title={c.description || c.title}
                onClick={readOnly ? undefined : () => startEdit(i)}
                className={cn(
                  "absolute flex items-center justify-center rounded-full text-center text-white shadow-sm",
                  readOnly ? "cursor-default" : "transition-shadow hover:shadow-md",
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
      </div>

      {/* ── 編集バー（印刷されない・記入例では非表示・円をクリックすると読み込まれる） ── */}
      {!readOnly && (
        <div className="no-print flex w-full items-center gap-4 rounded-xl border border-ws-line bg-ws-fill px-4 py-2.5">
          <div className="flex-1 space-y-1.5">
            {/* 行1：種類＋サイズ */}
            <div className="flex items-center gap-4">
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="shrink-0 text-xs font-semibold text-ws-teal">種類</span>
                <div className="flex gap-1">
                  {TYPES.map((t) => {
                    const on = current.type === t.key;
                    return (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setField({ type: t.key })}
                        className="rounded-md border-2 px-2.5 py-0.5 text-[11px] font-bold transition-colors"
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
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="shrink-0 text-xs font-semibold text-ws-teal">サイズ</span>
                <input
                  type="range"
                  min={1}
                  max={MAX_SIZE}
                  value={Math.min(MAX_SIZE, current.size)}
                  onChange={(e) => setField({ size: Number(e.target.value) })}
                  className="w-16 accent-ws-teal"
                />
                <span className="w-8 shrink-0 text-right text-xs text-ws-teal">
                  {current.size}/{MAX_SIZE}
                </span>
              </div>
            </div>

            {/* 行2：タイトル */}
            <div className="flex items-center gap-1.5">
              <span className="shrink-0 text-xs font-semibold text-ws-teal">
                タイトル{editing && <span className="text-ws-accent">（編集中）</span>}
              </span>
              <input
                value={current.title}
                onChange={(e) => setField({ title: e.target.value.slice(0, 30) })}
                placeholder="どんな場所で何している？"
                maxLength={30}
                className={cn(
                  "w-full rounded-md border px-2.5 py-1 text-sm text-ws-ink outline-none focus:border-ws-teal",
                  editing ? "border-ws-accent/50 bg-ws-mint/20" : "border-ws-line"
                )}
              />
            </div>
          </div>

          {/* 機能ボタン（カード右端に縦3つ・2行の高さに収める） */}
          <div className="flex shrink-0 flex-col gap-1">
            <button
              type="button"
              onClick={add}
              disabled={editing || !draft.title.trim() || value.length >= MAX}
              className="inline-flex items-center justify-center gap-1 rounded-md bg-ws-teal px-2.5 py-0.5 text-[11px] font-bold text-white transition hover:opacity-90 disabled:opacity-40"
            >
              <Plus className="h-3 w-3" />
              円を追加
            </button>
            <button
              type="button"
              onClick={finishEdit}
              disabled={!editing}
              className="inline-flex items-center justify-center gap-1 rounded-md bg-ws-teal px-2.5 py-0.5 text-[11px] font-bold text-white transition hover:opacity-90 disabled:opacity-40"
            >
              <Check className="h-3 w-3" />
              入力完了
            </button>
            <button
              type="button"
              onClick={() => remove(editingIndex as number)}
              disabled={!editing}
              className="inline-flex items-center justify-center gap-1 rounded-md border border-ws-line px-2.5 py-0.5 text-[11px] font-bold text-ws-muted transition hover:border-ws-accent hover:text-ws-accent disabled:opacity-40"
            >
              <Trash2 className="h-3 w-3" />
              円を削除
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
