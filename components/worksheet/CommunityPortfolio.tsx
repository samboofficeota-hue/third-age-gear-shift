"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * コミュニティ・ポートフォリオ。
 * 左＝サイドメニュー（操作）／右＝横長フレーム（表示・印刷対象）。
 * 種類ごとに象限を固定（家庭=左上/仕事=右上/ギフト=左下/学び=右下/その他=中央）。
 * 円のサイズ・タイトル・説明（マウスオーバー）を設定。最大10。
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

// 象限（grid: 左上=家庭 / 右上=仕事 / 左下=ギフト / 右下=学び）
const QUADRANTS: CircleType[] = ["family", "work", "gift", "learning"];

const MAX = 10;
const MIN_SIZE = 1;
const MAX_SIZE = 10;

/** size(1〜10) → 直径(px) */
function diameter(size: number): number {
  return 40 + (Math.max(1, Math.min(10, size)) - 1) * 8; // 40〜112px
}

function Circle({ c }: { c: PortfolioCircle }) {
  const t = TYPE_BY_KEY[c.type];
  const d = diameter(c.size);
  return (
    <div
      title={c.description || c.title}
      className="flex shrink-0 items-center justify-center rounded-full text-center text-white shadow-sm"
      style={{ width: d, height: d, backgroundColor: t.color }}
    >
      <span className="px-1.5 text-[11px] font-medium leading-tight line-clamp-3">
        {c.title}
      </span>
    </div>
  );
}

export function CommunityPortfolio({
  value,
  onChange,
}: {
  value: PortfolioCircle[];
  onChange: (next: PortfolioCircle[]) => void;
}) {
  const [type, setType] = useState<CircleType>("work");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [size, setSize] = useState(5);

  const add = () => {
    if (!title.trim() || value.length >= MAX) return;
    onChange([...value, { type, title: title.trim(), description: desc.trim(), size }]);
    setTitle("");
    setDesc("");
    setSize(5);
  };
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  const ofType = (k: CircleType) => value.filter((c) => c.type === k);

  return (
    <div className="mt-6 flex gap-8">
      {/* ── サイドメニュー（操作・印刷されない） ── */}
      <div className="no-print w-[300px] shrink-0">
        <p className="text-sm font-semibold text-ws-teal">コミュニティを追加</p>

        <div className="mt-3 space-y-3">
          {/* 種類 */}
          <div>
            <span className="mb-1.5 block text-xs font-semibold text-ws-muted">
              種類
            </span>
            <div className="flex flex-wrap gap-1.5">
              {TYPES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setType(t.key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                    type === t.key
                      ? "border-transparent text-white"
                      : "border-ws-line text-ws-ink hover:border-ws-teal"
                  )}
                  style={type === t.key ? { backgroundColor: t.color } : undefined}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: t.color }}
                  />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* タイトル */}
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-ws-muted">
              タイトル
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例）PICセンターの仕事"
              className="w-full rounded-md border border-ws-line px-3 py-2 text-sm text-ws-ink outline-none focus:border-ws-teal"
            />
          </label>

          {/* 説明 */}
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-ws-muted">
              説明（カーソルを乗せると表示）
            </span>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={2}
              placeholder="どんなコミュニティ／活動か"
              className="w-full resize-none rounded-md border border-ws-line px-3 py-2 text-sm text-ws-ink outline-none focus:border-ws-teal"
            />
          </label>

          {/* サイズ */}
          <label className="block">
            <span className="mb-1 flex items-center justify-between text-xs font-semibold text-ws-muted">
              <span>円のサイズ</span>
              <span className="text-ws-teal">{size}</span>
            </span>
            <input
              type="range"
              min={MIN_SIZE}
              max={MAX_SIZE}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-full accent-ws-teal"
            />
          </label>

          <button
            type="button"
            onClick={add}
            disabled={!title.trim() || value.length >= MAX}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ws-teal px-4 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
            円を追加（{value.length}/{MAX}）
          </button>
        </div>

        {/* 追加済みリスト */}
        {value.length > 0 && (
          <ul className="mt-4 space-y-1.5 border-t border-ws-line pt-3">
            {value.map((c, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: TYPE_BY_KEY[c.type].color }}
                />
                <span className="min-w-0 flex-1 truncate text-ws-ink">
                  {c.title}
                </span>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="shrink-0 text-ws-muted hover:text-ws-accent"
                  aria-label="削除"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── 表示エリア（横長フレーム・印刷対象） ── */}
      <div className="min-w-0 flex-1">
        <div className="relative h-[440px] overflow-hidden rounded-xl border-2 border-ws-line bg-white">
          {/* 4象限の薄い地＋ラベル */}
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
                  {ofType(k).map((c, i) => (
                    <Circle key={i} c={c} />
                  ))}
                </div>
              );
            })}
          </div>

          {/* 中央：その他 */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
            <span className="mb-1 text-[10px] font-bold text-ws-muted">その他</span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {ofType("other").map((c, i) => (
                <Circle key={i} c={c} />
              ))}
            </div>
          </div>
        </div>
        <p className="mt-2 text-xs text-ws-muted">
          種類ごとに象限が決まります（家庭=左上／仕事=右上／ギフト=左下／学び=右下／その他=中央）。円にカーソルを乗せると説明が出ます。
        </p>
      </div>
    </div>
  );
}
