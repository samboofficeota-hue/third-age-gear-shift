"use client";

import { Plus, Trash2 } from "lucide-react";

/**
 * "はたらく"の原点（じぶん分析）。
 * 「なぜ働くのか」の原点を、その原体験とセットで書き出す。
 * 初期1つ・ボタンで追加・最大3つ（A / B / C）。
 */

export type WorkOriginEntry = { reason: string; experience: string };

const MAX = 3;
const LABELS = ["A", "B", "C"];

const REASON_PH = [
  "（〜〜することが好きだから）",
  "（〜〜みたいになりたかったから）",
  "（〜〜を成し遂げたかったから）",
];
const EXP_PH = [
  "何歳の頃、どういう体験があって、将来はこんなことしてみたいと思った",
  "何歳の頃、どういう人と出会って、こんな人になりたいと思った",
  "そのとき、どんな経験をして、何を感じたか",
];

const EMPTY: WorkOriginEntry = { reason: "", experience: "" };

export function WorkOrigin({
  value,
  onChange,
  readOnly = false,
}: {
  value: WorkOriginEntry[];
  onChange?: (next: WorkOriginEntry[]) => void;
  readOnly?: boolean;
}) {
  const entries = readOnly
    ? value.filter((e) => e.reason.trim() || e.experience.trim())
    : value.length
    ? value
    : [{ ...EMPTY }];
  const canAdd = !readOnly && entries.length < MAX;
  const canRemove = !readOnly && entries.length > 1;

  const setField = (i: number, key: keyof WorkOriginEntry, v: string) =>
    onChange?.(entries.map((e, idx) => (idx === i ? { ...e, [key]: v } : e)));

  const add = () => {
    if (!canAdd) return;
    onChange?.([...entries, { ...EMPTY }]);
  };

  const remove = (i: number) => {
    if (!canRemove) return;
    if (
      (entries[i].reason.trim() || entries[i].experience.trim()) &&
      !window.confirm("この原点を削除しますか？")
    )
      return;
    onChange?.(entries.filter((_, idx) => idx !== i));
  };

  // 列が増える（＝幅が狭くなる）ほど、折り返しに備えて箱の天地を広げる
  const reasonRows = entries.length >= 3 ? 4 : entries.length === 2 ? 3 : 2;
  const expRows = entries.length >= 3 ? 7 : entries.length === 2 ? 5 : 4;

  return (
    <div className="mt-6">
      <div
        className={entries.length === 1 ? "mx-auto w-2/3" : "grid gap-6"}
        style={
          entries.length === 1
            ? undefined
            : { gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }
        }
      >
        {entries.map((e, i) => (
          <div key={i}>
            {/* 見出し＋削除 */}
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-ws-teal">
                はたらくの原点 {LABELS[i]}
              </span>
              {canRemove && (
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label={`原点${LABELS[i]}を削除`}
                  className="no-print text-ws-muted hover:text-ws-accent"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* 原点（言葉）— 枠つき */}
            {readOnly ? (
              <p className="mt-2 flex min-h-[3.5rem] items-center justify-center whitespace-pre-wrap rounded-md border-2 border-ws-teal/60 bg-ws-mint px-4 py-3 text-center text-lg font-bold leading-snug text-ws-ink">
                {e.reason}
              </p>
            ) : (
              <textarea
                value={e.reason}
                onChange={(ev) => setField(i, "reason", ev.target.value)}
                rows={reasonRows}
                placeholder={REASON_PH[i] ?? REASON_PH[0]}
                className="mt-2 w-full resize-none rounded-md border-2 border-ws-teal/60 px-4 py-3 text-center text-lg font-bold leading-snug text-ws-ink outline-none placeholder:font-normal placeholder:text-ws-muted/60 focus:border-ws-teal"
              />
            )}

            {/* その原体験 */}
            <span className="mt-4 block text-sm font-semibold text-ws-teal">
              その原体験
            </span>
            {readOnly ? (
              <p className="mt-1.5 whitespace-pre-wrap rounded-md border border-ws-line px-3 py-2 text-base leading-relaxed text-ws-ink">
                {e.experience}
              </p>
            ) : (
              <textarea
                value={e.experience}
                onChange={(ev) => setField(i, "experience", ev.target.value)}
                rows={expRows}
                placeholder={EXP_PH[i] ?? EXP_PH[0]}
                className="mt-1.5 w-full resize-none rounded-md border border-ws-line px-3 py-2 text-base leading-relaxed text-ws-ink outline-none placeholder:text-ws-muted/60 focus:border-ws-teal"
              />
            )}
          </div>
        ))}
      </div>

      {/* 原点を追加 */}
      {canAdd && (
        <div className="no-print mt-5 flex justify-center">
          <button
            type="button"
            onClick={add}
            className="inline-flex items-center gap-2 text-sm text-ws-muted hover:text-ws-teal"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-dashed border-ws-teal text-ws-teal">
              <Plus className="h-4 w-4" />
            </span>
            原点を追加（最大{MAX}つ）
          </button>
        </div>
      )}
    </div>
  );
}
