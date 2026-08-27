"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { ReportPolicy, ReportTexts } from "@/lib/report/generate.server";

/**
 * レポート本体の2列レイアウト（AI生成部分を含むためクライアント側で持つ）。
 *
 * 左: じぶん経営方針（MVV）＋ 働くことへの意識の変化（グラフはサーバー側で描いて渡す）
 * 右: 会社における／社会に対する「じぶん経営」
 *
 * 生成は3枠まとめて1回のAPI呼び出し。保存済みがあればそれを出し、AIは叩かない
 * （docs/REPORT_DESIGN.md §5）。取得状態を1箇所で持つため、カードを分割せず
 * このコンポーネントでまとめて描画している（分けると初回に二重生成される）。
 */
export function ReportBody({
  name,
  initial,
  chart,
  direction,
}: {
  name: string;
  initial: ReportTexts | null;
  /** 左中段に置くグラフ（サーバーコンポーネントで描画したもの） */
  chart: ReactNode;
  /** §D 今後の働き方の方向性（事前 → 事後） */
  direction: { pre: string | null; post: string | null };
}) {
  const [report, setReport] = useState<ReportTexts | null>(initial);
  const [loading, setLoading] = useState(initial === null);
  const [failed, setFailed] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (initial !== null || startedRef.current) return;
    startedRef.current = true;
    (async () => {
      try {
        const res = await fetch("/api/workshop/me/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({}),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data?.report) setReport(data.report as ReportTexts);
        else setFailed(true);
      } catch {
        setFailed(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [initial]);

  const fallback = <Placeholder loading={loading} failed={failed} />;

  return (
    /* 高さ固定。シート(710px)から余白80・見出し52・リード25・各marginを引いた残り。
       これで内容量によらずシートが710pxに収まる（超えると印刷が2ページに割れる）。 */
    <div className="mt-4 flex h-[521px] gap-6">
      {/* 左: 方針 ＋ 意識の変化 */}
      <div className="flex w-[460px] shrink-0 flex-col gap-4">
        {/* 左の2枚は高さを等分する。方針にグラフと同じだけの面を与えるため */}
        <Card title={`${name}の「じぶん経営」方針`} grow>
          {report?.policy ? <PolicyBody policy={report.policy} /> : fallback}
        </Card>
        {/* 1枚のカードに2要素（§Aのグラフ ＋ §Dの方向性を1行）。
            グラフは残った高さを埋める（min-h-0 が無いとflexが縮まない） */}
        <Card title="働くことへの意識の変化" grow>
          <div className="flex h-full min-h-0 w-full flex-col">
            <div className="min-h-0 flex-1">{chart}</div>
            <div className="mt-1 border-t border-ws-line pt-1">
              <DirectionRow pre={direction.pre} post={direction.post} />
            </div>
          </div>
        </Card>
      </div>

      {/* 右: 会社 ／ 社会 */}
      <div className="flex flex-1 flex-col gap-4">
        <Card title="会社における「じぶん経営」" grow>
          {report?.company ? <Body text={report.company} /> : fallback}
        </Card>
        <Card title="社会に対する「じぶん経営」" grow>
          {report?.society ? <Body text={report.society} /> : fallback}
        </Card>
      </div>
    </div>
  );
}

/** §D の選択が事前→事後でどう動いたかを1行で見せる */
function DirectionRow({ pre, post }: { pre: string | null; post: string | null }) {
  const changed = pre !== null && post !== null && pre !== post;
  return (
    <p className="flex w-full items-baseline gap-1.5 whitespace-nowrap text-[11px] leading-tight">
      <span className="shrink-0 font-bold text-ws-teal">今後の働き方</span>
      <span className="text-ws-ink">{pre ?? "（未回答）"}</span>
      <span className="shrink-0 font-bold text-ws-accent">→</span>
      <span className={changed ? "font-bold text-ws-accent" : "font-semibold text-ws-ink"}>
        {post ?? "（未回答）"}
      </span>
    </p>
  );
}

function PolicyBody({ policy }: { policy: ReportPolicy }) {
  return (
    <dl className="w-full space-y-2.5">
      <Row label="ミッション" sub="存在意義">
        {policy.mission || <Empty />}
      </Row>
      <Row label="ビジョン" sub="ありたい姿">
        {policy.vision || <Empty />}
      </Row>
      <Row label="バリュー" sub="行動指針">
        {policy.values.length ? (
          <ul>
            {policy.values.map((v) => (
              <li key={v} className="flex gap-1.5">
                <span className="shrink-0 text-ws-teal">・</span>
                <span>{v}</span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty />
        )}
      </Row>
    </dl>
  );
}

function Row({
  label,
  sub,
  children,
}: {
  label: string;
  sub: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <dt className="w-[76px] shrink-0 pt-px">
        <span className="block text-[11px] font-bold leading-tight text-ws-teal">{label}</span>
        <span className="block text-[10px] leading-tight text-ws-muted">{sub}</span>
      </dt>
      <dd className="flex-1 text-[13px] font-semibold leading-snug text-ws-ink">
        {children}
      </dd>
    </div>
  );
}

function Empty() {
  return <span className="text-xs font-normal text-ws-muted">—</span>;
}

function Body({ text }: { text: string }) {
  return (
    <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ws-ink">{text}</p>
  );
}

function Placeholder({ loading, failed }: { loading: boolean; failed: boolean }) {
  return (
    <p className="text-xs text-ws-muted">
      {loading
        ? "レポートを作成しています…"
        : failed
          ? "レポートを作成できませんでした。時間をおいて開き直してください。"
          : "ワークの記入が少ないため、まだレポートを作成できません。"}
    </p>
  );
}

function Card({
  title,
  grow,
  children,
}: {
  title: string;
  grow?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={`flex flex-col overflow-hidden rounded-xl border border-ws-line bg-white p-4 ${
        grow ? "min-h-0 flex-1" : ""
      }`}
    >
      <p className="mb-1.5 inline-block self-start rounded-full bg-ws-mint px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-ws-teal">
        {title}
      </p>
      <div className="flex min-h-0 flex-1 items-start">{children}</div>
    </section>
  );
}
