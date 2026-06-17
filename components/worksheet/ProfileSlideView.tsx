import { PrintSheet } from "@/components/worksheet/PrintSheet";
import { SheetHeader, formatHeaderName } from "@/components/worksheet/SheetHeader";
import { cn } from "@/lib/utils";

/**
 * じぶん紹介の「読み取り専用」表示（発表用）。
 * Program A（/workshop/pre/profile-slide）で入力したデータ（pre.profileSlide）を
 * Program B（/training）で読み込んで表示する。ルールシートは省き、3枚の本紙のみ。
 */

type HistRow = { year?: string; event?: string };
type Work = {
  company?: string;
  dept?: string;
  title?: string;
  q1?: string;
  q2?: string;
  q3?: string;
};
export type ProfileSlideData = {
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
const WORK_QUESTIONS: { key: "q1" | "q2" | "q3"; title: string }[] = [
  { key: "q1", title: "会社の役割" },
  { key: "q2", title: "組織の役割" },
  { key: "q3", title: "自分の役割" },
];

export function ProfileSlideView({ data }: { data: ProfileSlideData }) {
  const points = (data.points ?? []).filter((p) => p?.trim());
  const histRows = (data.history ?? []).filter(
    (h) => h.year?.trim() || h.event?.trim()
  );
  const work = data.work ?? {};

  const nm = (data.name ?? "").trim();
  const nk = (data.nickname ?? "").trim();
  const headerName = formatHeaderName(data.name, data.nickname);
  const nameTag = headerName ? (
    <span className="text-base font-bold text-ws-ink">{headerName}</span>
  ) : null;

  return (
    <>
      {/* ── ① 名前＋写真＋3ポイント ── */}
      <PrintSheet>
        <SheetHeader no={1} accent="じぶん" title="紹介" right={nameTag} />

        <div className="mt-6 flex min-h-[600px] gap-12">
          {/* 左：写真＋ニックネーム */}
          <div className="flex w-[340px] shrink-0 flex-col">
            <div className="mt-[115px]">
              <div className="relative mx-auto flex aspect-square w-[300px] items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-ws-line bg-ws-fill">
                {data.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={data.photo}
                    alt="プロフィール写真"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <p className="text-base font-semibold text-ws-muted">写真</p>
                )}
              </div>
            </div>
            <div className="mt-auto mb-[115px] pt-6 text-center">
              <p className="text-xs font-semibold text-ws-muted">ニックネーム</p>
              <p className="mt-1 text-3xl font-bold text-ws-accent">
                {nk || "　"}
              </p>
            </div>
          </div>

          {/* 右：名前＋ポイント */}
          <div className="flex flex-1 flex-col">
            <div className="border-b border-ws-line pb-4">
              <p className="text-xs font-semibold text-ws-muted">お名前</p>
              <p className="mt-1 text-3xl font-bold text-ws-ink">{nm || "　"}</p>
            </div>

            <p className="mt-6 text-sm font-semibold text-ws-teal">
              知ってほしい 3つのポイント
            </p>
            <ul className="mt-5 flex flex-1 flex-col justify-between py-2">
              {[0, 1, 2, 3, 4].map((i) => {
                const val = points[i] ?? "";
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
              })}
            </ul>
          </div>
        </div>
      </PrintSheet>

      {/* ── ② 生い立ち ── */}
      <PrintSheet>
        <SheetHeader
          no={1}
          accent="じぶん"
          title="紹介"
          sub="〜 生い立ち"
          right={nameTag}
        />
        <ul className="mt-7">
          {histRows.map((r, i) => {
            const isLast = i === histRows.length - 1;
            return (
              <li key={i} className="flex items-stretch gap-5">
                <div className="w-24 shrink-0 pt-1.5 text-right">
                  <span className="text-xl font-bold text-ws-teal">{r.year}</span>
                </div>
                <div className="flex w-4 shrink-0 flex-col items-center pt-2.5">
                  <span className="h-3.5 w-3.5 shrink-0 rounded-full bg-ws-teal" />
                  {!isLast && <span className="w-0.5 flex-1 bg-ws-line" />}
                </div>
                <div className="flex-1 pb-7">
                  <p className="pt-1 text-xl text-ws-ink">{r.event}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </PrintSheet>

      {/* ── ③ 今の会社・今の仕事 ── */}
      <PrintSheet>
        <SheetHeader
          no={1}
          accent="じぶん"
          title="紹介"
          sub="〜 今の会社・今の仕事"
          right={nameTag}
        />
        <div className="mt-7 flex min-h-[640px] flex-col">
          <div className="grid grid-cols-3 gap-7">
            {WORK_FIELDS.map(({ key, label }) => (
              <div key={key}>
                <span className="mb-3 block text-sm font-semibold text-ws-teal">
                  {label}
                </span>
                <p className="min-h-[5rem] whitespace-pre-wrap text-2xl font-bold leading-snug text-ws-ink">
                  {work[key]?.trim() || "　"}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid flex-1 grid-cols-3 divide-x divide-ws-line">
            {WORK_QUESTIONS.map(({ key, title }) => (
              <div key={key} className="flex flex-col px-6 first:pl-0 last:pr-0">
                <p className="text-lg font-bold text-ws-teal">{title}</p>
                <p className="mt-7 flex-1 whitespace-pre-line text-2xl leading-relaxed text-ws-ink">
                  {work[key]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </PrintSheet>
    </>
  );
}
