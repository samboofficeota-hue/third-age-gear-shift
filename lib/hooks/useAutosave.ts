"use client";

import { useEffect, useRef, useState } from "react";

export type AutosaveStatus = "idle" | "saving" | "saved";

/**
 * 値が変わってから一定時間操作が止まったら自動保存する。
 * enabled=false（初期ロード中など）の間は発火しない。有効化された直後の1回
 * （サーバーから読み込んだ初期値そのものの反映）は保存対象から除外する。
 *
 * saveNow() はデバウンスを待たずに今の値を即保存する（「保存して戻る」ボタン用）。
 */
export function useAutosave<T>(
  value: T,
  save: (v: T) => Promise<boolean>,
  opts?: { delay?: number; enabled?: boolean }
): { status: AutosaveStatus; saveNow: () => Promise<boolean> } {
  const delay = opts?.delay ?? 1200;
  const enabled = opts?.enabled ?? true;

  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const saveRef = useRef(save);
  saveRef.current = save;
  const valueRef = useRef(value);
  valueRef.current = value;

  // enabledになった最初のレンダーの value は「サーバーから読み込んだ初期値」なので
  // 保存対象から除外する。基準値との比較は内容（JSON文字列化）で行う：
  // React Strict Mode 下ではマウント時のデータ取得effectが二重実行され、
  // 中身が同じでも参照の異なるオブジェクトが複数回作られるため、参照比較(===)だと
  // 誤って「変更あり」と判定してしまう。
  const hasBaselineRef = useRef(false);
  const baselineRef = useRef<string | null>(null);
  if (enabled && !hasBaselineRef.current) {
    hasBaselineRef.current = true;
    baselineRef.current = JSON.stringify(value);
  }

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSave = (v: T) => {
    setStatus("saving");
    return saveRef.current(v).then((ok) => {
      setStatus(ok ? "saved" : "idle");
      if (ok) {
        baselineRef.current = JSON.stringify(v);
        if (clearStatusTimerRef.current) clearTimeout(clearStatusTimerRef.current);
        clearStatusTimerRef.current = setTimeout(() => setStatus("idle"), 2500);
      }
      return ok;
    });
  };

  useEffect(() => {
    if (!enabled) return;
    if (JSON.stringify(value) === baselineRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void runSave(value);
    }, delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, enabled, delay]);

  useEffect(() => {
    return () => {
      if (clearStatusTimerRef.current) clearTimeout(clearStatusTimerRef.current);
    };
  }, []);

  const saveNow = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    return runSave(valueRef.current);
  };

  return { status, saveNow };
}
