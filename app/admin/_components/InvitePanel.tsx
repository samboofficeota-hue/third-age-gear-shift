"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { InviteResult, InviteSummary } from "../types";

/**
 * 招待作成（A-3 / T-1）。参加者を事前登録して招待URLを発行する。
 * ここでは**メールは送らない**。発行された内容を確認したうえで、
 * 「メール」タブ（P-1）から招待メールを送るという二段構えにしている。
 */

type Row = { name: string; email: string; department: string; organizationName: string };

const EMPTY_ROW: Row = { name: "", email: "", department: "", organizationName: "" };

/**
 * CSV / TSV を表に分解する。
 * 引用符で囲まれた項目（"営業部, 第1課" のようにカンマを含む値）を壊さないため、
 * 単純な split ではなく1文字ずつ読む。"" は引用符1つとして扱う（CSVの標準）。
 */
function parseDelimited(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  // Excel が付ける BOM を落とす
  const src = text.replace(/^\uFEFF/, "");
  // 区切りは、1行目にタブがあればタブ、無ければカンマ
  const delimiter = (src.split(/\r?\n/)[0] ?? "").includes("\t") ? "\t" : ",";

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += c;
      }
      continue;
    }
    if (c === '"') {
      inQuotes = true;
    } else if (c === delimiter) {
      row.push(cell);
      cell = "";
    } else if (c === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (c !== "\r") {
      cell += c;
    }
  }
  row.push(cell);
  rows.push(row);

  return rows
    .map((r) => r.map((v) => v.trim()))
    .filter((r) => r.some((v) => v !== ""));
}

/** 見出し語 → 列の意味。Excelからの書き出しで表記が揺れるので幅を持たせる。 */
const HEADER_HINTS: { key: keyof Row; words: string[] }[] = [
  { key: "name", words: ["氏名", "名前", "お名前", "name"] },
  { key: "email", words: ["メール", "メールアドレス", "email", "mail", "e-mail"] },
  { key: "department", words: ["部署", "所属", "部署名", "department"] },
  { key: "organizationName", words: ["会社", "会社名", "企業", "組織", "organization", "company"] },
];

function looksLikeEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/**
 * 表 → 参加者の行。
 * 1行目が見出しなら、その語から列の対応を決める（列順が違っても取り込める）。
 * 見出しが無ければ「氏名, メール, 部署, 会社名」の順とみなす。
 */
function rowsFromTable(table: string[][]): Row[] {
  if (table.length === 0) return [];

  const first = table[0];
  const headerMap = new Map<number, keyof Row>();
  first.forEach((cell, i) => {
    const norm = cell.toLowerCase().replace(/\s/g, "");
    const hit = HEADER_HINTS.find((h) =>
      h.words.some((w) => norm === w.toLowerCase() || norm.includes(w.toLowerCase()))
    );
    if (hit) headerMap.set(i, hit.key);
  });
  // メール列らしきものが見出しとして見つかり、かつ1行目自体がデータでない場合のみ見出し扱い
  const hasHeader =
    headerMap.size >= 2 && !first.some((c) => looksLikeEmail(c));

  const body = hasHeader ? table.slice(1) : table;
  const order: (keyof Row)[] = ["name", "email", "department", "organizationName"];

  return body
    .map((cells) => {
      const row: Row = { ...EMPTY_ROW };
      cells.forEach((v, i) => {
        const key = hasHeader ? headerMap.get(i) : order[i];
        if (key) row[key] = v;
      });
      // 見出しが無く列順も違う場合の救済：メール列を探し直す
      if (!looksLikeEmail(row.email)) {
        const found = cells.find(looksLikeEmail);
        if (found) row.email = found;
      }
      return row;
    })
    .filter((r) => looksLikeEmail(r.email));
}

function parsePastedRows(text: string): Row[] {
  return rowsFromTable(parseDelimited(text));
}

/**
 * ファイルを文字列として読む。
 * Excel で保存したCSVは Shift_JIS のことが多く、UTF-8として読むと文字化けする。
 * 化け（U+FFFD）が出たら Shift_JIS で読み直す。
 */
async function readTextFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const utf8 = new TextDecoder("utf-8").decode(buffer);
  if (!utf8.includes("\uFFFD")) return utf8;
  try {
    return new TextDecoder("shift_jis").decode(buffer);
  } catch {
    return utf8;
  }
}

const RESULT_BADGE: Record<InviteResult["status"], { label: string; className: string }> = {
  created: { label: "新規登録", className: "bg-primary text-primary-foreground" },
  reissued: { label: "再発行", className: "bg-chart-3 text-white" },
  skipped: { label: "スキップ", className: "bg-secondary text-secondary-foreground" },
  error: { label: "エラー", className: "bg-destructive text-destructive-foreground" },
};

export function InvitePanel({
  sessionId,
  onInvited,
  onGoToMail,
}: {
  /** 登録先の研修。画面の文脈で固定されるので、ここでは選ばせない */
  sessionId: string;
  onInvited: () => void;
  /** 登録後に「メール」タブへ送る（招待メール送信はそちらで行う） */
  onGoToMail: () => void;
}) {
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [row, setRow] = useState<Row>(EMPTY_ROW);
  const [pasted, setPasted] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<InviteSummary | null>(null);
  const [results, setResults] = useState<InviteResult[]>([]);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const parsedRows = mode === "bulk" ? parsePastedRows(pasted) : [];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const participants = mode === "single" ? [row] : parsedRows;
    if (!sessionId) {
      setError("研修セッションを選択してください。");
      return;
    }
    if (participants.length === 0 || !participants[0].email) {
      setError("登録する参加者がいません。");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/invites", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, participants }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "登録に失敗しました。");
        return;
      }
      setSummary(data.summary);
      setResults(data.results ?? []);
      setRow(EMPTY_ROW);
      setPasted("");
      onInvited();
    } finally {
      setSubmitting(false);
    }
  };

  /** CSVファイルを読んで、貼り付け欄と同じ経路に流す（確認してから登録できる） */
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const text = await readTextFile(file);
      setPasted(text);
      setFileName(file.name);
    } catch {
      setError("ファイルを読み込めませんでした。CSV形式か確認してください。");
    } finally {
      // 同じファイルを選び直しても onChange が起きるようにする
      e.target.value = "";
    }
  };

  const copy = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 1500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold">受講生を追加する</h2>
        <p className="admin-page-note">
          この研修に受講生を事前登録し、アクティベーション用の招待URLを発行します。
          ここでは<span className="font-medium text-foreground">メールは送信されません</span>。
          内容を確認したあと「メール操作」から招待メールを送ってください。
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={mode === "single" ? "default" : "outline"}
          onClick={() => setMode("single")}
        >
          1名ずつ
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "bulk" ? "default" : "outline"}
          onClick={() => setMode("bulk")}
        >
          CSVで取り込む
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm">
            {mode === "single" ? "参加者情報" : "参加者リスト（CSV / スプレッドシート貼り付け）"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            {mode === "single" ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>氏名</Label>
                    <Input
                      value={row.name}
                      onChange={(e) => setRow({ ...row, name: e.target.value })}
                      placeholder="例: 太田 義史"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      メールアドレス <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="email"
                      value={row.email}
                      onChange={(e) => setRow({ ...row, email: e.target.value })}
                      placeholder="例: ota@example.co.jp"
                      autoCapitalize="none"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>会社名</Label>
                    <Input
                      value={row.organizationName}
                      onChange={(e) => setRow({ ...row, organizationName: e.target.value })}
                      placeholder="例: 株式会社COMMUNITY"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>部署名</Label>
                    <Input
                      value={row.department}
                      onChange={(e) => setRow({ ...row, department: e.target.value })}
                      placeholder="例: 経営企画部"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>CSVファイルを選ぶ</Label>
                  <input
                    type="file"
                    accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain"
                    onChange={handleFile}
                    className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:opacity-90"
                  />
                  <p className="text-xs text-muted-foreground">
                    列は「氏名・メール・部署・会社名」。1行目に見出しがあれば、その語を見て
                    列の並びが違っても取り込みます。Excel で保存した Shift_JIS のCSVも読めます。
                  </p>
                  {fileName && (
                    <p className="text-xs text-primary">
                      {fileName} を読み込みました。
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>
                    または、スプレッドシートから貼り付け（1行につき1名）
                  </Label>
                  <textarea
                    value={pasted}
                    onChange={(e) => {
                      setPasted(e.target.value);
                      setFileName(null);
                    }}
                    rows={6}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder={"太田 義史, ota@example.co.jp, 経営企画部, 株式会社COMMUNITY\n山田 花子, yamada@example.co.jp, 人事部, 株式会社COMMUNITY"}
                  />
                </div>

                <div className="rounded-lg border border-border bg-secondary/60 p-3">
                  <p className="text-xs text-muted-foreground">
                    現在{" "}
                    <span className="font-bold text-foreground">{parsedRows.length}</span>{" "}
                    名を認識しています。
                    {parsedRows.length === 0 && pasted.trim() !== "" && (
                      <span className="text-destructive">
                        {" "}
                        メールアドレスの列が見つかりませんでした。
                      </span>
                    )}
                  </p>
                  {parsedRows.length > 0 && (
                    <ul className="mt-2 space-y-0.5">
                      {parsedRows.slice(0, 5).map((r, i) => (
                        <li key={i} className="truncate text-xs">
                          <span className="font-medium">{r.name || "（氏名なし）"}</span>
                          <span className="ml-2 text-muted-foreground">{r.email}</span>
                          {(r.department || r.organizationName) && (
                            <span className="ml-2 text-muted-foreground">
                              {[r.organizationName, r.department].filter(Boolean).join(" / ")}
                            </span>
                          )}
                        </li>
                      ))}
                      {parsedRows.length > 5 && (
                        <li className="text-xs text-muted-foreground">
                          ほか {parsedRows.length - 5} 名
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={submitting || !sessionId}>
              {submitting
                ? "登録中..."
                : mode === "single"
                  ? "招待を作成する"
                  : `${parsedRows.length} 名の招待を作成する`}
            </Button>
          </form>
        </CardContent>
      </Card>

      {summary && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">登録結果</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.created + summary.reissued > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-accent px-3 py-2.5">
                <p className="text-sm text-accent-foreground">
                  {summary.created + summary.reissued} 名の招待URLを発行しました。招待メールを送りましょう。
                </p>
                <Button size="sm" onClick={onGoToMail}>
                  メールタブへ
                </Button>
              </div>
            )}
            <div className="flex flex-wrap gap-3 text-sm">
              <span>依頼 {summary.requested} 件</span>
              <span className="font-medium text-primary">新規 {summary.created}</span>
              <span className="font-medium text-chart-3">再発行 {summary.reissued}</span>
              <span className="text-muted-foreground">スキップ {summary.skipped}</span>
              {summary.error > 0 && (
                <span className="font-medium text-destructive">エラー {summary.error}</span>
              )}
            </div>

            <div className="divide-y rounded-md border">
              {results.map((r, i) => {
                const badge = RESULT_BADGE[r.status];
                return (
                  <div key={`${r.email}-${i}`} className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <Badge className={`px-1.5 py-0 text-caption ${badge.className}`}>
                        {badge.label}
                      </Badge>
                      <span className="truncate text-sm">{r.name ?? r.email}</span>
                      <span className="truncate text-xs text-muted-foreground">{r.email}</span>
                    </div>
                    {r.reason && (
                      <p className="mt-1 text-xs text-muted-foreground">{r.reason}</p>
                    )}
                    {r.inviteUrl && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <code className="min-w-0 flex-1 truncate rounded bg-muted px-2 py-1 text-caption">
                          {r.inviteUrl}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 flex-shrink-0 px-2 text-caption"
                          onClick={() => copy(r.inviteUrl!)}
                        >
                          {copiedUrl === r.inviteUrl ? "コピー済" : "コピー"}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
