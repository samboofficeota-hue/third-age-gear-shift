import Link from "next/link";
import { ArrowRight, Check, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { loadParticipantForView } from "../_lib";
import { ViewHeader } from "../ViewHeader";
import { SHEETS, type SheetGroup } from "../sheets";

/**
 * 運営が見る「その受講生のポータル」。
 * 受講生の /training（研修当日ポータル）と同じ並び・同じ見た目にして、
 * 講師も受講生と同じ導線でシートをたどれるようにする。
 *
 * 受講生側と違って**開放状態でゲートしない**。講師は進行の判断のために
 * 未開放のシートの中身も見る必要があるため。
 */
export default async function ParticipantViewPortalPage({
  params,
}: {
  params: { sessionId: string; userId: string };
}) {
  const { user, backTo } = await loadParticipantForView(params.sessionId, params.userId);
  const done = user.workshopData?.completedPhases ?? [];
  const base = `/view/${params.sessionId}/${params.userId}`;

  const groups: SheetGroup[] = ["pre", "day1", "homework", "day2"];
  const GROUP_LABEL: Record<SheetGroup, string> = {
    pre: "事前課題",
    day1: "Day 1",
    homework: "宿題",
    day2: "Day 2",
  };

  const participantName = user.name ?? user.email;

  return (
    <>
      <ViewHeader
        backTo={backTo}
        backLabel="受講生一覧に戻る"
        note={`${participantName} さんの画面`}
      />
      <div className="mx-auto max-w-3xl px-4 py-4 md:px-8">
      <header className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-ws-teal">
          講師用ビュー
        </p>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-ws-ink">
          {user.name ?? user.email} さんのワーク
        </h1>
        <p className="mt-1.5 text-sm text-ws-muted">
          {[user.organization?.name, user.department].filter(Boolean).join(" / ") ||
            user.email}
        </p>
      </header>

      <div className="space-y-5">
        {groups.map((group) => {
          const sheets = SHEETS.filter((s) => s.group === group);
          const groupDone = done.includes(group);
          return (
            <section key={group}>
              <div className="mb-1.5 flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                    groupDone ? "bg-ws-teal text-white" : "bg-white text-ws-muted"
                  )}
                >
                  {groupDone ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <UserCircle className="h-3.5 w-3.5" />
                  )}
                </span>
                <h2 className="text-sm font-bold text-ws-ink">{GROUP_LABEL[group]}</h2>
                {groupDone && (
                  <span className="text-xs text-ws-teal">提出済み</span>
                )}
              </div>

              <ol className="space-y-1.5">
                {sheets.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`${base}/${s.id}`}
                      className="flex items-center justify-between gap-4 rounded-xl border border-ws-line bg-white p-2.5 transition-colors hover:border-ws-teal"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ws-ink">{s.label}</p>
                        <p className="text-xs text-ws-muted">{s.description}</p>
                      </div>
                      <ArrowRight className="h-5 w-5 shrink-0 text-ws-teal" />
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
      </div>
      </div>
    </>
  );
}
