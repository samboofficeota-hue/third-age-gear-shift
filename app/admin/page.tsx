"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// 5フェーズ構成（id は lib/phases.ts の PHASE_IDS と一致）。
// 説明文は管理者向けの概要。詳細ワーク内容は今後のステップで追記。
const BLOCK_META = [
  {
    id: "pre",
    shortLabel: "事前課題",
    label: "事前課題",
    step: "PRE",
    description: "事前アンケート（スマホ対応）と じぶん紹介ワークシート。最初から開放。",
    tasks: ["事前アンケートに回答", "じぶん紹介を作成（Day1で発表）"],
    inputs: ["事前アンケート（§A〜D）", "じぶん紹介（名前・3ポイント・生い立ち・今の会社/仕事）"],
    output: "事前アンケート回答 ＋ じぶん紹介を保存",
    day: "事前",
  },
  {
    id: "day1",
    shortLabel: "Day 1",
    label: "Day 1：じぶん分解・じぶん分析",
    step: "DAY 1",
    description: "じぶん分解（分人シェア／コミュニティポートフォリオ）と じぶん分析（好き得意／はたらくの原点／会社とじぶんの一致点）。",
    tasks: ["分人シェア・コミュニティポートフォリオを記入", "好き得意マトリクス・はたらくの原点・一致点を記入"],
    inputs: ["分人シェア表", "コミュニティポートフォリオ", "好き得意 2×2", "はたらくの原点 A/B", "会社とじぶんの一致点"],
    output: "Day1 ワークシートを保存",
    day: "DAY 1",
  },
  {
    id: "homework",
    shortLabel: "宿題",
    label: "宿題：みらいシナリオ",
    step: "HOMEWORK",
    description: "2040年のじぶんがいる社会を言語化（Vision／Issue／Reason）。AIが伴走（予定）。",
    tasks: ["#1 Vision（だれが・なにを・どう）を記入", "#2 Issue・#3 Reason を記入"],
    inputs: ["みらいシナリオ（複数可）"],
    output: "みらいシナリオを保存",
    day: "宿題",
  },
  {
    id: "day2",
    shortLabel: "Day 2",
    label: "Day 2：ビジョン・資本・シフト戦略",
    step: "DAY 2",
    description: "ビジョン策定／資本戦略（Wish-Can-Shall）／シフト戦略。（内容は改良中）",
    tasks: ["じぶんビジョンを策定", "資本戦略を棚卸し", "シフト戦略・一歩目を決める"],
    inputs: ["ビジョン策定シート", "資本戦略シート", "シフト戦略シート"],
    output: "Day2 ワークシートを保存",
    day: "DAY 2",
  },
  {
    id: "post",
    shortLabel: "事後課題",
    label: "事後課題",
    step: "POST",
    description: "事後アンケート（§A〜D共通＋§E研修評価）。スマホ対応。",
    tasks: ["事後アンケートに回答"],
    inputs: ["事後アンケート（§A〜E）"],
    output: "事後アンケート回答を保存",
    day: "事後",
  },
] as const;

type BlockStatus = "LOCKED" | "PREVIEW" | "OPEN" | "CLOSED";
type BlockInfo = { blockId: string; status: BlockStatus; openedAt: string | null };
type Participant = { id: string; email: string; name: string | null; completedPhases: string[]; lastUpdated: string | null };
type SessionInfo = { id: string; name: string | null; code: string; isActive: boolean; createdAt: string; participantCount: number };

const STATUS_LABEL: Record<BlockStatus, string> = {
  LOCKED: "ロック中", PREVIEW: "プレビュー", OPEN: "開放中", CLOSED: "クローズ",
};

function statusBadgeVariant(status: BlockStatus): "secondary" | "default" | "destructive" | "outline" {
  if (status === "OPEN") return "default";
  if (status === "CLOSED") return "destructive";
  if (status === "PREVIEW") return "outline";
  return "secondary";
}

const STATUS_DOT: Record<BlockStatus, string> = {
  LOCKED: "bg-stone-300", PREVIEW: "bg-blue-400", OPEN: "bg-primary", CLOSED: "bg-destructive",
};

function formatTime(iso: string | null) {
  if (!iso) return "－";
  return new Date(iso).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ja-JP", { year: "numeric", month: "numeric", day: "numeric" });
}

function ParticipantModal({ participant, onClose }: { participant: Participant; onClose: () => void }) {
  const completedSet = new Set(participant.completedPhases);
  const progress = Math.round((participant.completedPhases.length / 5) * 100);
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {(participant.name ?? participant.email).slice(0, 1).toUpperCase()}
            </div>
            <div>
              <DialogTitle>{participant.name ?? participant.email}</DialogTitle>
              {participant.name && <p className="text-xs text-muted-foreground">{participant.email}</p>}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">完了フェーズ</span>
              <span className="font-bold">{participant.completedPhases.length} / 5</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="mt-2 text-xs text-muted-foreground">最終更新：{formatTime(participant.lastUpdated)}</p>
          </div>

          <Separator />

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">ブロック別進捗</p>
            <div className="space-y-2">
              {BLOCK_META.map((meta) => {
                const done = completedSet.has(meta.id);
                return (
                  <div key={meta.id} className="flex items-center gap-3">
                    <span className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 text-[10px] ${done ? "border-primary bg-primary text-primary-foreground" : "border-muted bg-background"}`}>
                      {done ? "✓" : ""}
                    </span>
                    <span className={`text-sm ${done ? "text-foreground" : "text-muted-foreground"}`}>
                      {meta.shortLabel}
                      <span className="ml-1 text-xs text-muted-foreground">{meta.step}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminPage() {
  const [blocks, setBlocks] = useState<BlockInfo[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [selectedSessionName, setSelectedSessionName] = useState<string>("");
  const [selectedSessionCode, setSelectedSessionCode] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string>("pre");
  const [sideTab, setSideTab] = useState<"blocks" | "participants" | "sessions">("blocks");
  const [modalParticipant, setModalParticipant] = useState<Participant | null>(null);
  const [newSessionName, setNewSessionName] = useState("");
  const [newSessionCode, setNewSessionCode] = useState("");
  const [creatingSession, setCreatingSession] = useState(false);
  const [sessionFormError, setSessionFormError] = useState<string | null>(null);

  const fetchSessionData = useCallback(async (sessionId: string) => {
    const [bRes, pRes] = await Promise.all([
      fetch(`/api/admin/blocks?sessionId=${sessionId}`, { credentials: "include" }),
      fetch(`/api/admin/participants?sessionId=${sessionId}`, { credentials: "include" }),
    ]);
    const [bData, pData] = await Promise.all([bRes.json(), pRes.json()]);
    if (!bRes.ok) throw new Error(bData.error ?? "ブロック情報の取得に失敗しました。");
    setBlocks(bData.blocks ?? []);
    setSelectedSessionName(bData.sessionName ?? "");
    setSelectedSessionCode(bData.sessionCode ?? "");
    setParticipants(pData.participants ?? []);
  }, []);

  const fetchData = useCallback(async () => {
    const sRes = await fetch("/api/admin/sessions", { credentials: "include" });
    if (sRes.status === 401 || sRes.status === 403) { window.location.href = "/login?from=/admin"; return; }
    const sData = await sRes.json();
    const sessionList: SessionInfo[] = sData.sessions ?? [];
    setSessions(sessionList);
    if (sessionList.length === 0) { setLoading(false); return; }
    const defaultSession = sessionList[0];
    setSelectedSessionId(defaultSession.id);
    await fetchSessionData(defaultSession.id);
    setLoading(false);
  }, [fetchSessionData]);

  useEffect(() => {
    fetchData().catch(() => { setError("データの取得に失敗しました。"); setLoading(false); });
  }, [fetchData]);

  const switchSession = useCallback(async (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setSideTab("blocks");
    try { await fetchSessionData(sessionId); } catch { setError("セッションデータの取得に失敗しました。"); }
  }, [fetchSessionData]);

  const updateBlock = async (blockId: string, status: BlockStatus) => {
    setUpdating(blockId);
    try {
      const res = await fetch("/api/admin/blocks", {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockId, status, sessionId: selectedSessionId }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.error ?? "更新に失敗しました。"); return; }
      setBlocks((prev) => prev.map((b) =>
        b.blockId === blockId ? { ...b, status, openedAt: status === "OPEN" ? new Date().toISOString() : b.openedAt } : b
      ));
    } finally { setUpdating(null); }
  };

  const createSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setSessionFormError(null);
    setCreatingSession(true);
    try {
      const res = await fetch("/api/admin/sessions", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSessionName || undefined, code: newSessionCode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setSessionFormError(data.error ?? "作成に失敗しました。"); return; }
      setSessions((prev) => [{ ...data.session, participantCount: 0 }, ...prev]);
      setNewSessionName(""); setNewSessionCode("");
    } finally { setCreatingSession(false); }
  };

  const toggleSession = async (id: string, isActive: boolean) => {
    const res = await fetch("/api/admin/sessions", {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive }),
    });
    if (!res.ok) return;
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, isActive } : s)));
  };

  const totalParticipants = participants.length;
  const completionCount = (blockId: string) => participants.filter((p) => p.completedPhases.includes(blockId)).length;
  const selectedMeta = BLOCK_META.find((m) => m.id === selectedBlockId) ?? BLOCK_META[0];
  const selectedBlock = blocks.find((b) => b.blockId === selectedBlockId);
  const selectedStatus: BlockStatus = selectedBlock?.status ?? "LOCKED";
  const currentSession = sessions.find((s) => s.id === selectedSessionId);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">読み込み中...</p>
    </div>
  );
  if (error) return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-destructive">{error}</p>
    </div>
  );

  return (
    <>
      <div className="flex h-[calc(100vh-56px)] overflow-hidden">
        {/* ===== 左サイドバー ===== */}
        <aside className="flex w-72 flex-shrink-0 flex-col border-r bg-card">
          {/* タブ */}
          <div className="flex border-b">
            {(["blocks", "participants", "sessions"] as const).map((tab) => {
              const labels = { blocks: "ブロック", participants: "受講生", sessions: "セッション" };
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setSideTab(tab)}
                  className={`flex-1 border-b-2 py-3 text-xs font-medium transition-colors ${
                    sideTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {labels[tab]}
                  {tab === "participants" && totalParticipants > 0 && (
                    <Badge variant="secondary" className="ml-1 text-[10px]">{totalParticipants}</Badge>
                  )}
                </button>
              );
            })}
          </div>

          {/* 現在のセッション表示 */}
          {sideTab !== "sessions" && (
            <div className="border-b px-4 py-2.5">
              {currentSession ? (
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">{currentSession.name ?? "（名前なし）"}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">{currentSession.code}</p>
                  </div>
                  <span className="flex-shrink-0 text-xs text-muted-foreground">受講生 {totalParticipants} 名</span>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">セッションを選択してください</p>
              )}
            </div>
          )}

          {/* ブロック一覧 */}
          {sideTab === "blocks" && (
            <nav className="flex-1 overflow-y-auto py-1">
              {sessions.length === 0 ? (
                <p className="px-4 py-8 text-center text-xs text-muted-foreground">セッションタブで作成してください</p>
              ) : (
                BLOCK_META.map((meta) => {
                  const blockInfo = blocks.find((b) => b.blockId === meta.id);
                  const status: BlockStatus = blockInfo?.status ?? "LOCKED";
                  const isSelected = selectedBlockId === meta.id;
                  const isUpdating = updating === meta.id;
                  const done = completionCount(meta.id);
                  return (
                    <div
                      key={meta.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedBlockId(meta.id)}
                      onKeyDown={(e) => e.key === "Enter" && setSelectedBlockId(meta.id)}
                      className={`w-full cursor-pointer px-4 py-3 text-left transition-colors ${
                        isSelected ? "border-l-2 border-primary bg-accent" : "border-l-2 border-transparent hover:bg-accent/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`mt-0.5 h-2 w-2 flex-shrink-0 rounded-full ${STATUS_DOT[status]}`} />
                        <span className="flex-1 text-xs font-medium">
                          {meta.shortLabel}
                          <span className="ml-1 font-normal text-muted-foreground">{meta.step}</span>
                        </span>
                        <Badge variant={statusBadgeVariant(status)} className="text-[10px] px-1.5 py-0">
                          {STATUS_LABEL[status]}
                        </Badge>
                      </div>
                      {status !== "LOCKED" && (
                        <p className="mt-1 pl-4 text-[10px] text-muted-foreground">完了 {done}/{totalParticipants} 名</p>
                      )}
                      {isSelected && (
                        <div className="mt-2 flex flex-wrap gap-1.5 pl-4">
                          {status !== "OPEN" && (
                            <Button size="sm" variant="default" disabled={isUpdating} className="h-6 text-[10px] px-2"
                              onClick={(e) => { e.stopPropagation(); updateBlock(meta.id, "OPEN"); }}>
                              ▶ 開放する
                            </Button>
                          )}
                          {status === "OPEN" && (
                            <Button size="sm" variant="destructive" disabled={isUpdating} className="h-6 text-[10px] px-2"
                              onClick={(e) => { e.stopPropagation(); updateBlock(meta.id, "CLOSED"); }}>
                              ⏸ 停止する
                            </Button>
                          )}
                          {status !== "LOCKED" && (
                            <Button size="sm" variant="outline" disabled={isUpdating} className="h-6 text-[10px] px-2"
                              onClick={(e) => { e.stopPropagation(); updateBlock(meta.id, "LOCKED"); }}>
                              🔒 ロック
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </nav>
          )}

          {/* 受講生一覧 */}
          {sideTab === "participants" && (
            <div className="flex-1 overflow-y-auto py-1">
              {participants.length === 0 ? (
                <p className="px-4 py-8 text-center text-xs text-muted-foreground">受講生が登録されていません</p>
              ) : (
                participants.map((p) => {
                  const progress = Math.round((p.completedPhases.length / 5) * 100);
                  return (
                    <button key={p.id} type="button" onClick={() => setModalParticipant(p)}
                      className="w-full px-4 py-3 text-left transition-colors hover:bg-accent/50">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {(p.name ?? p.email).slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium">{p.name ?? p.email}</p>
                          <p className="text-[10px] text-muted-foreground">{p.completedPhases.length}/5 完了</p>
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">{progress}%</span>
                      </div>
                      <Progress value={progress} className="mt-1.5 h-1" />
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* セッション一覧 */}
          {sideTab === "sessions" && (
            <div className="flex-1 overflow-y-auto py-1">
              {sessions.length === 0 ? (
                <p className="px-4 py-8 text-center text-xs text-muted-foreground">セッションがありません</p>
              ) : (
                sessions.map((s) => {
                  const isManaging = s.id === selectedSessionId;
                  return (
                    <div key={s.id} className={`border-b px-4 py-3 ${isManaging ? "bg-primary/5" : ""}`}>
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            {isManaging && <Badge className="text-[9px] px-1.5 py-0">管理中</Badge>}
                            <p className="truncate text-xs font-bold">{s.name ?? "（名前なし）"}</p>
                          </div>
                          <p className="mt-0.5 font-mono text-xs text-muted-foreground">{s.code}</p>
                          <p className="mt-0.5 text-[10px] text-muted-foreground">
                            {formatDate(s.createdAt)} · 受講生 {s.participantCount} 名
                          </p>
                        </div>
                        <Button size="sm" variant={s.isActive ? "secondary" : "outline"}
                          className="h-6 flex-shrink-0 text-[10px] px-2"
                          onClick={() => toggleSession(s.id, !s.isActive)}>
                          {s.isActive ? "有効" : "無効"}
                        </Button>
                      </div>
                      {!isManaging && (
                        <Button size="sm" variant="outline" className="mt-2 w-full h-7 text-xs border-primary/30 text-primary hover:bg-primary/5"
                          onClick={() => switchSession(s.id)}>
                          このセッションを管理する
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </aside>

        {/* ===== 右パネル ===== */}
        <main className="flex flex-1 flex-col overflow-hidden bg-stone-50">
          <div className="flex-1 overflow-y-auto p-6">

            {/* セッション管理パネル */}
            {sideTab === "sessions" && (
              <div className="mx-auto max-w-lg space-y-6">
                <div>
                  <h2 className="text-lg font-bold">セッション管理</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    受講生が入力する「研修コード」を作成・管理します。サイドバーの「このセッションを管理する」でブロック制御と受講生リストの対象を切り替えられます。
                  </p>
                </div>

                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-sm">新しいセッションを作成</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={createSession} className="space-y-4">
                      <div className="space-y-2">
                        <Label>セッション名（任意）</Label>
                        <Input value={newSessionName} onChange={(e) => setNewSessionName(e.target.value)}
                          placeholder="例: 2026年2月 第1回" />
                      </div>
                      <div className="space-y-2">
                        <Label>研修コード <span className="text-destructive">*</span></Label>
                        <Input value={newSessionCode} onChange={(e) => setNewSessionCode(e.target.value)}
                          className="font-mono" placeholder="例: 3rdage0201" autoCapitalize="none" required />
                        <p className="text-xs text-muted-foreground">英数字・ハイフン・アンダースコア、4〜32文字</p>
                      </div>
                      {sessionFormError && (
                        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{sessionFormError}</p>
                      )}
                      <Button type="submit" className="w-full" disabled={creatingSession}>
                        {creatingSession ? "作成中..." : "セッションを作成"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {sessions.length > 0 && (
                  <Card className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">既存のセッション</CardTitle>
                    </CardHeader>
                    <div className="divide-y">
                      {sessions.map((s) => (
                        <div key={s.id} className="flex items-center gap-4 px-6 py-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              {s.id === selectedSessionId && <Badge className="text-[9px] px-1.5 py-0">管理中</Badge>}
                              <p className="text-sm font-medium">{s.name ?? "（名前なし）"}</p>
                            </div>
                            <div className="mt-0.5 flex items-center gap-2">
                              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{s.code}</code>
                              <span className="text-xs text-muted-foreground">{formatDate(s.createdAt)}</span>
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground">受講生 {s.participantCount} 名</p>
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            <Button size="sm" variant={s.isActive ? "secondary" : "outline"}
                              className="h-7 text-xs"
                              onClick={() => toggleSession(s.id, !s.isActive)}>
                              {s.isActive ? "有効" : "無効"}
                            </Button>
                            {s.id !== selectedSessionId && (
                              <Button size="sm" variant="outline"
                                className="h-7 text-xs border-primary/30 text-primary hover:bg-primary/5"
                                onClick={() => switchSession(s.id)}>
                                管理する
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* ブロックプレビューパネル */}
            {sideTab !== "sessions" && (
              <div className="mx-auto max-w-2xl space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{selectedMeta.day}</span>
                      <span>·</span>
                      <span>{selectedMeta.step}</span>
                    </div>
                    <h2 className="mt-1 text-xl font-bold">{selectedMeta.label}</h2>
                  </div>
                  <Badge variant={statusBadgeVariant(selectedStatus)} className="mt-1">
                    {STATUS_LABEL[selectedStatus]}
                  </Badge>
                </div>

                <Card>
                  <CardContent className="pt-5">
                    <p className="text-sm leading-relaxed text-muted-foreground">{selectedMeta.description}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">受講生が行うこと</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ol className="space-y-2">
                      {selectedMeta.tasks.map((task, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                          {task}
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">入力項目</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-1.5">
                      {selectedMeta.inputs.map((input, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-border" />
                          {input}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary/70">完了条件・アウトプット</p>
                  <p className="mt-1 text-sm">{selectedMeta.output}</p>
                </div>

                {selectedStatus !== "LOCKED" && totalParticipants > 0 && (
                  <Card>
                    <CardContent className="pt-5">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">完了した受講生</span>
                        <span className="font-bold">{completionCount(selectedMeta.id)} / {totalParticipants} 名</span>
                      </div>
                      <Progress value={(completionCount(selectedMeta.id) / totalParticipants) * 100} className="h-2" />
                      {selectedBlock?.openedAt && (
                        <p className="mt-2 text-xs text-muted-foreground">開放日時：{formatTime(selectedBlock.openedAt)}</p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {modalParticipant && (
        <ParticipantModal participant={modalParticipant} onClose={() => setModalParticipant(null)} />
      )}
    </>
  );
}
