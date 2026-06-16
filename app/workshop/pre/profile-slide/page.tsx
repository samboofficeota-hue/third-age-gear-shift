"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ImagePlus, Plus } from "lucide-react";
import { PrintSheet } from "@/components/worksheet/PrintSheet";
import { WorksheetStage } from "@/components/worksheet/WorksheetStage";
import { PrintButton } from "@/components/worksheet/PrintButton";
import { CropModal } from "@/components/worksheet/CropModal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type HistRow = { year: string; event: string };
type Work = {
  company?: string;
  dept?: string;
  title?: string;
  q1?: string; // 会社は何のため・誰に・何を
  q2?: string; // あなたの役割・価値
  q3?: string; // どんな仕事・役割・責任
};
type Slide = {
  name?: string;
  nickname?: string;
  points?: string[];
  photo?: string;
  history?: HistRow[];
  work?: Work;
};

const WORK_FIELDS: { key: "company" | "dept" | "title"; label: string }[] = [
  { key: "company", label: "会社名" },
  { key: "dept", label: "部署名" },
  { key: "title", label: "役職名" },
];
const WORK_QUESTIONS: { key: "q1" | "q2" | "q3"; q: string }[] = [
  { key: "q1", q: "この会社は、何のために・誰に・何をしている会社ですか？" },
  { key: "q2", q: "その中で、あなたはどんな役割・価値を担っていますか？" },
  { key: "q3", q: "具体的に、どんな仕事・役割・責任がありますか？" },
];

const SAMPLE: Required<Slide> = {
  name: "太田 義史",
  nickname: "ぼうず",
  points: ["沖縄県 長寿家系 生", "東大 少林寺拳法学部 卒", "電通流 プロデュース術", "", ""],
  photo: "/images/worksheets/ota.png",
  history: [
    { year: "1972", event: "沖縄県で生まれる（長男・AB型・魚座・復帰年）" },
    { year: "1987", event: "鹿児島 ラ・サール高校入学（男子校の寮生活）" },
    { year: "1990", event: "東京大学 入学（少林寺拳法学部 経営学科 マーケティングゼミ）" },
    { year: "1995", event: "電通に入社（営業・プロデューサー 一筋26年）" },
    { year: "2004", event: "北京電通に出向（2回駐在 延べ9年）" },
    { year: "2021", event: "50歳からは全く違う道を目指し電通を退職" },
    { year: "2022", event: "アライアンス・フォーラム財団で公益資本主義に携わる" },
    { year: "2024", event: "サンボーオフィス（アイディアで経営に参謀する・中小企業診断士）" },
    { year: "2026", event: "公益資本主義実装センター 設立（現在に至る）" },
  ],
  work: {
    company: "サンボーオフィス",
    dept: "（個人事業）",
    title: "代表・中小企業診断士",
    q1: "中小企業の経営者に対して、アイディアと戦略で経営に伴走し、事業の成長と挑戦を後押ししている。",
    q2: "経営者の「参謀」として、外からの視点で戦略を描き、意思決定を支える役割。アイディアそのものが提供価値。",
    q3: "経営相談・事業計画づくり・マーケティング支援・補助金申請のサポートまで、構想から実行まで伴走する。",
  },
};

const MIN_HIST_ROWS = 6;

// 入力欄のサンプル（プレースホルダ）。1行目=生年は任意、それ以降は記入例で誘導。
const HIST_PH: HistRow[] = [
  { year: "生年", event: "〇〇県で生まれる" },
  { year: "19xx", event: "〇〇高校に入学" },
  { year: "19xx", event: "〇〇大学を卒業" },
  { year: "20xx", event: "〇〇株式会社に入社" },
  { year: "20xx", event: "〇〇部署へ異動" },
  { year: "20xx", event: "現在に至る" },
];
const HIST_PH_FALLBACK: HistRow = { year: "20xx", event: "出来事を記入" };

function pad(points?: string[]): string[] {
  const p = [...(points ?? [])];
  while (p.length < 5) p.push("");
  return p.slice(0, 5);
}

function padHist(history: HistRow[] | undefined, n: number): HistRow[] {
  const h = [...(history ?? [])];
  while (h.length < n) h.push({ year: "", event: "" });
  return h;
}

/** 円形の写真枠（読み込み失敗時はプレースホルダ＋ヒント表示） */
function PhotoFrame({ src }: { src?: string }) {
  const [err, setErr] = useState(false);
  useEffect(() => setErr(false), [src]);
  return (
    <div className="relative mx-auto flex aspect-square w-[300px] items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-ws-line bg-ws-fill">
      {src && !err ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt="プロフィール写真"
          onError={() => setErr(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="px-8 text-center">
          <p className="text-base font-semibold text-ws-muted">写真</p>
          <p className="mt-2 text-xs leading-relaxed text-ws-muted">
            恥ずかしがらずに写真をドーンと！
          </p>
        </div>
      )}
    </div>
  );
}

export default function ProfileSlidePage() {
  const [data, setData] = useState<Slide>({ points: pad([]) });
  const [mode, setMode] = useState<"edit" | "sample">("edit");
  const [visibleCount, setVisibleCount] = useState(3);
  const [histCount, setHistCount] = useState(MIN_HIST_ROWS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const d = await fetch("/api/workshop/me", { credentials: "include" })
        .then((r) => r.json())
        .catch(() => ({}));
      const ps = d?.workshopData?.pre?.profileSlide as Slide | undefined;
      if (ps) {
        const points = pad(ps.points);
        setData({ ...ps, points });
        const filled = points.filter((p) => p.trim()).length;
        setVisibleCount(Math.min(5, Math.max(3, filled)));
        setHistCount(Math.max(MIN_HIST_ROWS, ps.history?.length ?? 0));
      }
      setLoading(false);
    })();
  }, []);

  const isSample = mode === "sample";
  const view: Slide = isSample ? SAMPLE : { ...data, points: pad(data.points) };

  // タイトル行の右側に出す「ニックネーム（お名前）」。ニックネーム未記入ならお名前のみ。
  const headerName = (() => {
    const nm = (view.name ?? "").trim();
    const nk = (view.nickname ?? "").trim();
    if (nk && nm) return `${nk}（${nm}）`;
    return nm || nk;
  })();

  const setField = (patch: Partial<Slide>) => {
    if (isSample) return;
    setData((d) => ({ ...d, ...patch }));
    setSaved(false);
  };
  const setPoint = (i: number, v: string) => {
    if (isSample) return;
    setData((d) => {
      const points = pad(d.points);
      points[i] = v;
      return { ...d, points };
    });
    setSaved(false);
  };
  const setWork = (key: keyof Work, v: string) => {
    if (isSample) return;
    setData((d) => ({ ...d, work: { ...d.work, [key]: v } }));
    setSaved(false);
  };
  const setHist = (i: number, key: keyof HistRow, v: string) => {
    if (isSample) return;
    setData((d) => {
      const history = padHist(d.history, histCount);
      history[i] = { ...history[i], [key]: v };
      return { ...d, history };
    });
    setSaved(false);
  };

  // ファイル選択 → クロップモーダルを開く
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isSample) return;
    const reader = new FileReader();
    reader.onload = () => setCropSrc(String(reader.result));
    reader.readAsDataURL(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  // クロップ確定 → Storage にアップロード → URL を保存
  const onCropped = async (blob: Blob) => {
    setCropSrc(null);
    setPhotoUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", new File([blob], "photo.jpg", { type: "image/jpeg" }));
      const res = await fetch("/api/workshop/me/photo", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.url) setField({ photo: d.url });
      else alert(d.error ?? "アップロードに失敗しました。");
    } finally {
      setPhotoUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/workshop/me/pre", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ profileSlide: { ...data, points: pad(data.points) } }),
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

  const allPoints = pad(view.points);
  const histRows = isSample
    ? SAMPLE.history.filter((h) => h.year.trim() || h.event.trim())
    : padHist(data.history, histCount);

  return (
    <WorksheetStage>
      {/* 操作バー（印刷されない） */}
      <div className="no-print flex w-full max-w-[1123px] flex-wrap items-center justify-between gap-3">
        <Link
          href="/workshop/pre"
          className="text-sm text-[#a0c0b0] transition-colors hover:text-primary"
        >
          ← 事前課題へ戻る
        </Link>
        <div className="flex items-center gap-2">
          {(["edit", "sample"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                mode === m
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-[rgba(0,255,136,0.2)] text-[#a0c0b0] hover:text-[#e0f0e8]"
              )}
            >
              {m === "edit" ? "記入する" : "記入例を見る"}
            </button>
          ))}
          <PrintButton />
        </div>
      </div>

      {/* ── ルールシート ── */}
      <PrintSheet>
        <div className="flex items-center justify-between border-b border-ws-line pb-4">
          <div className="flex items-center gap-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ws-teal text-lg font-bold text-white">
              1
            </span>
            <h1 className="text-3xl font-bold text-ws-ink">
              <span className="text-ws-accent">じぶん</span> 紹介
            </h1>
          </div>
          {headerName && (
            <span className="text-base font-bold text-ws-ink">{headerName}</span>
          )}
        </div>
        <div className="mt-10 rounded-2xl bg-ws-mint p-10">
          <span className="inline-block rounded-full border border-ws-teal bg-white px-4 py-1 text-sm font-semibold text-ws-teal">
            ルール
          </span>
          <dl className="mt-8 space-y-7 text-ws-ink">
            <div className="flex gap-8">
              <dt className="w-32 shrink-0 font-bold">● 発表時間</dt>
              <dd>
                <span className="text-2xl font-bold text-ws-accent">5分以内</span>
                <span className="ml-2 text-sm text-ws-muted">（1ページ 1分以内を目安に）</span>
              </dd>
            </div>
            <div className="flex gap-8">
              <dt className="w-32 shrink-0 font-bold">● 目的</dt>
              <dd className="space-y-1.5 leading-relaxed">
                <p>他のメンバーに <span className="font-bold text-ws-accent">わたし</span> のことを知ってもらうこと</p>
                <p>自分で <span className="font-bold text-ws-accent">わたし</span> について掘り下げてみること</p>
              </dd>
            </div>
            <div className="flex gap-8">
              <dt className="w-32 shrink-0 font-bold">● 内容</dt>
              <dd className="space-y-1.5 leading-relaxed">
                <p>知ってほしい 3つのポイント</p>
                <p>生い立ち</p>
                <p>今の会社・今の仕事</p>
              </dd>
            </div>
          </dl>
        </div>
      </PrintSheet>

      {/* ── ページ① 名前＋写真＋3ポイント ── */}
      <PrintSheet>
        <div className="flex items-center justify-between border-b border-ws-line pb-4">
          <div className="flex items-center gap-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ws-teal text-lg font-bold text-white">
              1
            </span>
            <h1 className="text-3xl font-bold text-ws-ink">
              <span className="text-ws-accent">じぶん</span> 紹介
            </h1>
          </div>
          {headerName && (
            <span className="text-base font-bold text-ws-ink">{headerName}</span>
          )}
        </div>

        {/* 左右2カラム。シート高いっぱいに上下分散 */}
        <div className="mt-6 flex min-h-[600px] gap-12">
          {/* 左：写真=上寄せ ／ ニックネーム=下揃え */}
          <div className="flex w-[340px] shrink-0 flex-col">
            <div className="mt-[115px]">
              <PhotoFrame src={view.photo} />
            </div>

            {!isSample && (
              <div className="no-print mt-4 text-center">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={onFile}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={photoUploading}
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-lg border border-ws-line px-4 py-2 text-sm text-ws-ink hover:border-ws-teal disabled:opacity-60"
                >
                  <ImagePlus className="h-4 w-4" />
                  {photoUploading ? "アップロード中…" : "写真をアップロード"}
                </button>
              </div>
            )}

            {/* ニックネーム（下端から115px上げる） */}
            <div className="mt-auto mb-[115px] pt-6">
              {isSample ? (
                <div className="text-center">
                  <p className="text-xs font-semibold text-ws-muted">
                    ニックネーム
                  </p>
                  <p className="mt-1 text-3xl font-bold text-ws-accent">
                    {view.nickname}
                  </p>
                </div>
              ) : (
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-ws-muted">
                    ニックネーム（研修中に呼ばれたい名前）
                  </span>
                  <input
                    value={data.nickname ?? ""}
                    onChange={(e) => setField({ nickname: e.target.value })}
                    placeholder="ニックネーム"
                    className="w-full rounded-md border border-ws-line px-3 py-2 text-center text-2xl font-bold text-ws-accent outline-none focus:border-ws-teal"
                  />
                </label>
              )}
            </div>
          </div>

          {/* 右：お名前=上寄せ ／ ポイント=分散（最後を下揃え） */}
          <div className="flex flex-1 flex-col">
            <div className="border-b border-ws-line pb-4">
              {isSample ? (
                <>
                  <p className="text-xs font-semibold text-ws-muted">お名前</p>
                  <p className="mt-1 text-3xl font-bold text-ws-ink">{view.name}</p>
                </>
              ) : (
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-ws-muted">
                    お名前
                  </span>
                  <input
                    value={data.name ?? ""}
                    onChange={(e) => setField({ name: e.target.value })}
                    placeholder="お名前"
                    className="w-full rounded-md border border-ws-line px-3 py-2 text-3xl font-bold text-ws-ink outline-none focus:border-ws-teal"
                  />
                </label>
              )}
            </div>

            <p className="mt-6 text-sm font-semibold text-ws-teal">
              知ってほしい 3つのポイント
            </p>
            {/* 常に5枠ぶんの位置を確保（3つでも上から並び、増えても行間は一定） */}
            <ul className="mt-5 flex flex-1 flex-col justify-between py-2">
              {[0, 1, 2, 3, 4].map((i) => {
                const val = allPoints[i] ?? "";
                const showInput = !isSample && i < visibleCount;
                const isAddSlot =
                  !isSample && i === visibleCount && visibleCount < 5;

                if (isSample) {
                  const has = !!val.trim();
                  return (
                    <li key={i} className="flex items-center gap-4">
                      <span
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ws-accent text-base font-bold text-white",
                          !has && "opacity-0"
                        )}
                      >
                        {i + 1}
                      </span>
                      <span className="text-3xl font-medium text-ws-ink">
                        {val || "　"}
                      </span>
                    </li>
                  );
                }
                if (showInput) {
                  return (
                    <li key={i} className="flex items-center gap-4">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ws-accent text-base font-bold text-white">
                        {i + 1}
                      </span>
                      <input
                        value={val}
                        onChange={(e) => setPoint(i, e.target.value)}
                        placeholder="（一言で）"
                        maxLength={25}
                        className="w-full rounded-md border border-ws-line px-3 py-2 text-3xl text-ws-ink outline-none focus:border-ws-teal"
                      />
                    </li>
                  );
                }
                if (isAddSlot) {
                  return (
                    <li key={i} className="no-print flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => setVisibleCount((c) => Math.min(5, c + 1))}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-ws-line text-ws-muted hover:border-ws-teal hover:text-ws-teal"
                        aria-label="ポイントを追加"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <span className="text-sm text-ws-muted">
                        ポイントを追加（最大5つ）
                      </span>
                    </li>
                  );
                }
                // 空きスロット（位置を保持）
                return (
                  <li key={i} className="flex items-center gap-4" aria-hidden>
                    <span className="h-9 w-9 shrink-0 opacity-0" />
                    <span className="text-3xl opacity-0">　</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </PrintSheet>

      {/* ── ページ③ 生い立ち（縦タイムライン） ── */}
      <PrintSheet>
        <div className="flex items-center justify-between border-b border-ws-line pb-4">
          <div className="flex items-center gap-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ws-teal text-lg font-bold text-white">
              1
            </span>
            <h1 className="text-3xl font-bold text-ws-ink">
              <span className="text-ws-accent">じぶん</span> 紹介{" "}
              <span className="text-ws-muted">〜 生い立ち</span>
            </h1>
          </div>
          {headerName && (
            <span className="text-base font-bold text-ws-ink">{headerName}</span>
          )}
        </div>

        <p className="mt-3 text-sm text-ws-muted">
          どんな環境で、どんな経歴を歩んできたか。年表でも文章でもOK。
          <span className="text-ws-teal">生年は記入なしでもOKです。</span>
        </p>

        <ul className="mt-7">
          {histRows.map((r, i) => {
            const isLast = i === histRows.length - 1;
            const ph = HIST_PH[i] ?? HIST_PH_FALLBACK;
            return (
              <li key={i} className="flex items-stretch gap-5">
                {/* 年 */}
                <div className="w-24 shrink-0 pt-1.5 text-right">
                  {isSample ? (
                    <span className="text-xl font-bold text-ws-teal">{r.year}</span>
                  ) : (
                    <input
                      value={r.year}
                      onChange={(e) => setHist(i, "year", e.target.value)}
                      placeholder={ph.year}
                      maxLength={9}
                      className="w-full rounded-md border border-ws-line px-2 py-1.5 text-right text-lg font-bold text-ws-teal outline-none focus:border-ws-teal"
                    />
                  )}
                </div>
                {/* タイムライン（線＋ドット） */}
                <div className="flex w-4 shrink-0 flex-col items-center pt-2.5">
                  <span className="h-3.5 w-3.5 shrink-0 rounded-full bg-ws-teal" />
                  {!isLast && <span className="w-0.5 flex-1 bg-ws-line" />}
                </div>
                {/* 出来事 */}
                <div className="flex-1 pb-7">
                  {isSample ? (
                    <p className="pt-1 text-xl text-ws-ink">{r.event}</p>
                  ) : (
                    <input
                      value={r.event}
                      onChange={(e) => setHist(i, "event", e.target.value)}
                      placeholder={ph.event}
                      className="w-full rounded-md border border-ws-line px-3 py-2 text-lg text-ws-ink outline-none focus:border-ws-teal"
                    />
                  )}
                </div>
              </li>
            );
          })}

          {/* 行を追加 */}
          {!isSample && (
            <li className="no-print flex gap-5">
              <div className="w-24 shrink-0" />
              <div className="flex w-4 shrink-0 justify-center">
                <button
                  type="button"
                  onClick={() => setHistCount((c) => c + 1)}
                  aria-label="行を追加"
                  className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-dashed border-ws-line text-ws-muted hover:border-ws-teal hover:text-ws-teal"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <span className="pt-1 text-sm text-ws-muted">行を追加</span>
            </li>
          )}
        </ul>
      </PrintSheet>

      {/* ── ページ④ 今の会社・今の仕事 ── */}
      <PrintSheet>
        <div className="flex items-center justify-between border-b border-ws-line pb-4">
          <div className="flex items-center gap-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ws-teal text-lg font-bold text-white">
              1
            </span>
            <h1 className="text-3xl font-bold text-ws-ink">
              <span className="text-ws-accent">じぶん</span> 紹介{" "}
              <span className="text-ws-muted">〜 今の会社・今の仕事</span>
            </h1>
          </div>
          {headerName && (
            <span className="text-base font-bold text-ws-ink">{headerName}</span>
          )}
        </div>

        {/* シート高いっぱいに上下分散 */}
        <div className="mt-7 flex min-h-[640px] flex-col">
          {/* 会社名 / 部署名 / 役職名 */}
          <div className="grid grid-cols-3 gap-7">
            {WORK_FIELDS.map(({ key, label }) => (
              <div key={key}>
                <span className="mb-1.5 block text-xs font-semibold text-ws-muted">
                  {label}
                </span>
                {isSample ? (
                  <p className="border-b-2 border-ws-line pb-2 text-2xl font-bold text-ws-ink">
                    {view.work?.[key] || "　"}
                  </p>
                ) : (
                  <input
                    value={data.work?.[key] ?? ""}
                    onChange={(e) => setWork(key, e.target.value)}
                    placeholder={label}
                    className="w-full rounded-md border border-ws-line px-3 py-2 text-2xl font-bold text-ws-ink outline-none focus:border-ws-teal"
                  />
                )}
              </div>
            ))}
          </div>

          {/* 3つの問い（残り高さに分散） */}
          <div className="mt-9 flex flex-1 flex-col justify-between gap-6">
            {WORK_QUESTIONS.map(({ key, q }, idx) => (
              <div key={key}>
                <p className="flex items-center gap-3 text-base font-semibold text-ws-teal">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ws-teal text-sm font-bold text-white">
                    {idx + 1}
                  </span>
                  {q}
                </p>
                {isSample ? (
                  <p className="mt-3 pl-10 text-lg leading-relaxed text-ws-ink">
                    {view.work?.[key]}
                  </p>
                ) : (
                  <textarea
                    value={data.work?.[key] ?? ""}
                    onChange={(e) => setWork(key, e.target.value)}
                    rows={3}
                    placeholder="（自由記入）"
                    className="mt-3 ml-10 w-[calc(100%-2.5rem)] resize-none rounded-md border border-ws-line px-3 py-2 text-lg leading-relaxed text-ws-ink outline-none focus:border-ws-teal"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </PrintSheet>

      {/* 保存（印刷されない） */}
      {!isSample && (
        <div className="no-print flex w-full max-w-[1123px] items-center gap-3">
          <Button onClick={save} disabled={saving}>
            {saving ? "保存中..." : "保存する"}
          </Button>
          {saved && <span className="text-sm text-primary">保存しました ✓</span>}
        </div>
      )}

      {/* クロップモーダル */}
      {cropSrc && (
        <CropModal
          src={cropSrc}
          onCancel={() => setCropSrc(null)}
          onConfirm={onCropped}
        />
      )}
    </WorksheetStage>
  );
}
