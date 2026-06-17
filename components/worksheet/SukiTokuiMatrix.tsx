"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 好き・得意マトリクス（じぶん分析）。
 * 左＝サイドメニュー（入力・印刷されない）／右＝固定サイズの2×2フレーム（表示・印刷対象）。
 * 縦＝個人／会社・横＝得意／好き。各象限は基本1つ・最大2（2〜3行でコンパクトに）。
 */

type RowKey = "personal" | "company";
type ColKey = "good" | "like";
export type MatrixEntry = { row: RowKey; col: ColKey; text: string };

const ROWS: { key: RowKey; label: string }[] = [
  { key: "personal", label: "個人" },
  { key: "company", label: "会社" },
];
const COLS: { key: ColKey; label: string }[] = [
  { key: "good", label: "得意" },
  { key: "like", label: "好き" },
];

const MAX_PER_CELL = 2;
const FRAME_W = 600;
const FRAME_H = 440;

export function SukiTokuiMatrix({
  value,
  onChange,
}: {
  value: MatrixEntry[];
  onChange: (next: MatrixEntry[]) => void;
}) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<{ row: RowKey; col: ColKey; text: string }>(
    { row: "personal", col: "good", text: "" }
  );

  const editing = editingIndex !== null && editingIndex < value.length;
  const current = editing ? value[editingIndex as number] : draft;

  const setField = (
    patch: Partial<{ row: RowKey; col: ColKey; text: string }>
  ) => {
    if (editing) {
      onChange(
        value.map((e, i) => (i === editingIndex ? { ...e, ...patch } : e))
      );
    } else {
      setDraft((d) => ({ ...d, ...patch }));
    }
  };

  const countOf = (row: RowKey, col: ColKey) =>
    value.filter((e) => e.row === row && e.col === col).length;
  const entriesOf = (row: RowKey, col: ColKey) =>
    value
      .map((e, i) => ({ e, i }))
      .filter((x) => x.e.row === row && x.e.col === col);

  const cellFull = countOf(draft.row, draft.col) >= MAX_PER_CELL;

  const add = () => {
    if (!draft.text.trim() || cellFull) return;
    onChange([...value, { ...draft, text: draft.text.trim() }]);
    setDraft((d) => ({ ...d, text: "" }));
  };
  const startEdit = (i: number) => setEditingIndex(i);
  const finishEdit = () => {
    setEditingIndex(null);
    setDraft((d) => ({ ...d, text: "" }));
  };
  const pickCell = (row: RowKey, col: ColKey) => {
    finishEdit();
    setDraft((d) => ({ ...d, row, col }));
  };
  const remove = (i: number) => {
    if (!window.confirm("この項目を削除しますか？")) return;
    onChange(value.filter((_, idx) => idx !== i));
    if (editingIndex === i) finishEdit();
    else if (editingIndex !== null && i < editingIndex)
      setEditingIndex(editingIndex - 1);
  };

  const rowLabel = (k: RowKey) => ROWS.find((r) => r.key === k)!.label;
  const colLabel = (k: ColKey) => COLS.find((c) => c.key === k)!.label;

  return (
    <div className="mt-6 flex gap-8 print:justify-center">
      {/* ── サイドメニュー（印刷されない） ── */}
      <div className="no-print w-[320px] shrink-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-ws-ink">好き・得意を追加</p>
          {editing && (
            <span className="rounded bg-ws-mint px-2 py-0.5 text-[11px] font-semibold text-ws-teal">
              編集中
            </span>
          )}
        </div>

        <div className="mt-3 space-y-3">
          {/* 縦軸：個人/会社 */}
          <div>
            <span className="mb-1.5 block text-xs font-semibold text-ws-muted">
              個人 ／ 会社
            </span>
            <div className="flex gap-1">
              {ROWS.map((r) => {
                const on = current.row === r.key;
                return (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => setField({ row: r.key })}
                    className={cn(
                      "flex-1 rounded-md border-2 py-1.5 text-xs font-semibold transition-colors",
                      on
                        ? "border-ws-teal bg-ws-teal text-white"
                        : "border-ws-line text-ws-ink hover:border-ws-teal"
                    )}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 横軸：得意/好き */}
          <div>
            <span className="mb-1.5 block text-xs font-semibold text-ws-muted">
              得意 ／ 好き
            </span>
            <div className="flex gap-1">
              {COLS.map((c) => {
                const on = current.col === c.key;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setField({ col: c.key })}
                    className={cn(
                      "flex-1 rounded-md border-2 py-1.5 text-xs font-semibold transition-colors",
                      on
                        ? "border-ws-accent bg-ws-accent text-white"
                        : "border-ws-line text-ws-ink hover:border-ws-accent"
                    )}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* テキスト */}
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-ws-muted">
              内容（1〜2行で簡潔に）
            </span>
            <textarea
              value={current.text}
              onChange={(e) => setField({ text: e.target.value })}
              rows={2}
              placeholder="アイデアをとりあえず資料に落とすこと"
              className="w-full resize-none rounded-md border border-ws-line px-3 py-2 text-sm text-ws-ink outline-none focus:border-ws-teal"
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
              disabled={!draft.text.trim() || cellFull}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ws-teal px-4 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
              {cellFull
                ? `「${rowLabel(draft.row)}×${colLabel(draft.col)}」は最大2つ`
                : "追加する"}
            </button>
          )}
        </div>
      </div>

      {/* ── 表示エリア（2×2フレーム・印刷対象） ── */}
      <div className="shrink-0">
        <div
          className="grid"
          style={{
            width: FRAME_W,
            height: FRAME_H,
            gridTemplateColumns: "34px 1fr 1fr",
            gridTemplateRows: "28px 1fr 1fr",
          }}
        >
          {/* 左上の角（空） */}
          <div style={{ gridColumn: "1", gridRow: "1" }} />
          {/* 横軸：左=得意 / 右=好き */}
          <div
            style={{ gridColumn: "2", gridRow: "1" }}
            className="flex items-center justify-center text-sm font-bold text-ws-accent"
          >
            得意
          </div>
          <div
            style={{ gridColumn: "3", gridRow: "1" }}
            className="flex items-center justify-center text-sm font-bold text-ws-accent"
          >
            好き
          </div>
          {/* 縦軸：上=個人 / 下=会社 */}
          <div
            style={{ gridColumn: "1", gridRow: "2" }}
            className="flex items-center justify-center text-base font-bold text-ws-teal [writing-mode:vertical-rl]"
          >
            個人
          </div>
          <div
            style={{ gridColumn: "1", gridRow: "3" }}
            className="flex items-center justify-center text-base font-bold text-ws-teal [writing-mode:vertical-rl]"
          >
            会社
          </div>

          {/* 4セル（行=個人/会社・列=得意/好き） */}
          {ROWS.map((r, ri) =>
            COLS.map((c, ci) => {
              const entries = entriesOf(r.key, c.key);
              const isPick =
                !editing && draft.row === r.key && draft.col === c.key;
              return (
                <button
                  key={`${r.key}-${c.key}`}
                  type="button"
                  style={{ gridColumn: String(ci + 2), gridRow: String(ri + 2) }}
                  onClick={() => pickCell(r.key, c.key)}
                  className={cn(
                    "relative flex flex-col items-stretch justify-center gap-1.5 border border-ws-line p-3 text-left transition-colors",
                    isPick ? "bg-ws-mint/50" : "bg-white hover:bg-ws-fill/60"
                  )}
                >
                  {entries.length === 0 ? (
                    <span className="text-center text-xs text-ws-muted/70">
                      クリックして追加
                    </span>
                  ) : (
                    entries.map((x) => (
                      <span
                        key={x.i}
                        role="button"
                        tabIndex={0}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          startEdit(x.i);
                        }}
                        className={cn(
                          "flex min-h-[3.5rem] items-center justify-center whitespace-pre-wrap rounded-md border px-3 py-2 text-center text-base font-bold leading-snug text-ws-ink",
                          editingIndex === x.i
                            ? "border-ws-teal bg-ws-mint"
                            : "border-ws-line bg-ws-fill hover:border-ws-teal"
                        )}
                      >
                        {x.e.text}
                      </span>
                    ))
                  )}
                </button>
              );
            })
          )}
        </div>
        <p className="no-print mt-2 text-xs text-ws-muted">
          マスをクリックして追加、項目をクリックして編集できます（縦＝個人／会社・横＝得意／好き）。
        </p>
      </div>
    </div>
  );
}
