"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ImagePlus, Plus } from "lucide-react";
import { PrintSheet } from "@/components/worksheet/PrintSheet";
import { SheetHeader } from "@/components/worksheet/SheetHeader";
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
  { key: "title", label: "肩書き・役割" },
];
const WORK_QUESTIONS: { key: "q1" | "q2" | "q3"; title: string; q: string }[] = [
  {
    key: "q1",
    title: "会社の役割",
    q: "何のために、誰に向けて、何をしている会社？",
  },
  {
    key: "q2",
    title: "組織の役割",
    q: "会社の中での役割は？\n担っている責任は？",
  },
  {
    key: "q3",
    title: "自分の役割",
    q: "どんな仕事をしている？\n誰に対する仕事かな？\n組織の中での役割は？",
  },
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
    company: "合同会社 公益資本主義実装センター",
    dept: "",
    title: "代表社員　実装プロデューサー",
    q1: "公益資本主義を理解し、自身が社会にどう貢献するか実践できる人材づくりと、その活躍を広げる場づくり",
    q2: "ボトムアップ型での啓発・啓蒙\n個人をエンパワーメントしていく",
    q3: "公益資本主義を理解できるコンテンツの開発と体験プログラムの企画・実装\n理解した人たちが会社の枠を超えて活動できるコミュニティづくり",
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
      const acct = (d?.account ?? {}) as {
        organizationName?: string | null;
        department?: string | null;
      };
      const ps = d?.workshopData?.pre?.profileSlide as Slide | undefined;
      const points = pad(ps?.points);
      // 会社名・部署名は事前登録（DB）の値で初期化（未保存時のみ）。
      setData({
        ...ps,
        points,
        work: {
          ...ps?.work,
          company: ps?.work?.company ?? acct.organizationName ?? "",
          dept: ps?.work?.dept ?? acct.department ?? "",
        },
      });
      if (ps) {
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

  // 右上スロット。①じぶん紹介（ルール＋名前ページ）までは「事前課題」、
  // 自己紹介が済む②生い立ち以降は氏名を表示。
  const preTag = (
    <span className="text-sm font-semibold text-ws-teal">事前課題</span>
  );
  const nameTag = headerName ? (
    <span className="text-base font-bold text-ws-ink">{headerName}</span>
  ) : null;

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
        <SheetHeader no={1} accent="じぶん" title="紹介" right={preTag} />
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
        <SheetHeader no={1} accent="じぶん" title="紹介" right={preTag} />

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

      {/* ── ページ② 生い立ち（縦タイムライン） ── */}
      <PrintSheet>
        <SheetHeader
          no={1}
          accent="じぶん"
          title="紹介"
          sub="〜 生い立ち"
          right={nameTag}
        />

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

      {/* ── ページ③ 今の会社・今の仕事 ── */}
      <PrintSheet>
        <SheetHeader
          no={1}
          accent="じぶん"
          title="紹介"
          sub="〜 今の会社・今の仕事"
          right={nameTag}
        />

        {/* シート高いっぱいに使う */}
        <div className="mt-7 flex min-h-[640px] flex-col">
          {/* 会社名 / 部署名 / 役職名・肩書き・役割（2行分の高さを確保） */}
          <div className="grid grid-cols-3 gap-7">
            {WORK_FIELDS.map(({ key, label }) => {
              // 会社名・部署名はDB値で初期化済み。役職名は空欄＋記入例を表示。
              const ph =
                key === "title" ? "例）部長・〇〇リーダー・プロデューサー" : label;
              return (
                <div key={key}>
                  <span className="mb-3 block text-sm font-semibold text-ws-teal">
                    {label}
                  </span>
                  {isSample ? (
                    <p className="min-h-[5rem] whitespace-pre-wrap text-2xl font-bold leading-snug text-ws-ink">
                      {view.work?.[key] || "　"}
                    </p>
                  ) : (
                    <textarea
                      value={data.work?.[key] ?? ""}
                      onChange={(e) => setWork(key, e.target.value)}
                      placeholder={ph}
                      rows={2}
                      className="w-full resize-none rounded-md border border-ws-line px-3 py-2 text-2xl font-bold leading-snug text-ws-ink outline-none placeholder:font-normal placeholder:text-ws-muted/70 focus:border-ws-teal"
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* 3つの問い＝3カラム。タイトル＝ティール文字（下線なし）、カラム間に薄い縦線 */}
          <div className="mt-8 grid flex-1 grid-cols-3 divide-x divide-ws-line">
            {WORK_QUESTIONS.map(({ key, title, q }) => (
              <div
                key={key}
                className="flex flex-col px-6 first:pl-0 last:pr-0"
              >
                <p className="text-lg font-bold text-ws-teal">{title}</p>
                {isSample ? (
                  <p className="mt-7 flex-1 whitespace-pre-line text-2xl leading-relaxed text-ws-ink">
                    {view.work?.[key]}
                  </p>
                ) : (
                  <textarea
                    value={data.work?.[key] ?? ""}
                    onChange={(e) => setWork(key, e.target.value)}
                    placeholder={q}
                    className="mt-7 w-full flex-1 resize-none rounded-md border border-transparent bg-transparent text-2xl leading-relaxed text-ws-ink outline-none placeholder:text-ws-muted/70 focus:border-ws-teal"
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
