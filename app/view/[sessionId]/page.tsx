import Link from "next/link";
import { Check } from "lucide-react";
import { WorksheetStage } from "@/components/worksheet/WorksheetStage";
import { PrintSheet } from "@/components/worksheet/PrintSheet";
import { SheetHeader } from "@/components/worksheet/SheetHeader";
import { cn } from "@/lib/utils";
import { ViewHeader } from "./ViewHeader";
import { loadSessionForView } from "./_lib";
import type { Slide } from "@/app/workshop/pre/profile-slide/_types";

/**
 * 講師画面（投影ページ）。研修中はこの1ページをスクリーンに出しっぱなしにする。
 *
 * 受講生ごとに別ページを開くのではなく、ここに受講生をカードで並べ、
 * 発表する人のカードを押してその人のワークへ入る。投影中に「戻る」を押しても
 * ここまでしか戻らないので、管理画面がスクリーンに映る事故が起きない。
 *
 * 体裁は個人のワークシート投影と同じ（ワークシートのシート面に載せる）。
 */
export default async function ViewRosterPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const { workshopSession, participants } = await loadSessionForView(params.sessionId);

  return (
    <>
      <ViewHeader
        backTo={`/admin/sessions/${params.sessionId}`}
        backLabel="管理画面に戻る"
        note={workshopSession.name ?? workshopSession.code}
      />
      <WorksheetStage>
        <PrintSheet>
          <SheetHeader
            accent="受講生"
            title="・一覧"
            right={
              <span className="text-sm font-semibold text-ws-teal">
                {workshopSession.name ?? workshopSession.code}
              </span>
            }
          />

          {participants.length === 0 ? (
            <p className="mt-10 text-center text-ws-muted">
              受講生がまだ登録されていません。
            </p>
          ) : (
            <ul className="mt-6 grid grid-cols-3 gap-3">
              {participants.map((p) => {
                const done = p.workshopData?.completedPhases ?? [];
                const slide = (p.workshopData?.pre as { profileSlide?: Slide } | null)
                  ?.profileSlide;
                const nickname = slide?.nickname?.trim();
                const displayName = slide?.name?.trim() || p.name || p.email;
                const affiliation =
                  [p.organization?.name, p.department].filter(Boolean).join(" / ") || null;

                return (
                  <li key={p.id}>
                    <Link
                      href={`/view/${params.sessionId}/${p.id}`}
                      className={cn(
                        "flex h-full flex-col justify-between rounded-xl border border-ws-line bg-white p-4",
                        "transition-colors hover:border-ws-teal hover:bg-ws-mint/30"
                      )}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-lg font-bold text-ws-ink">
                          {displayName}
                        </p>
                        {nickname && (
                          <p className="truncate text-sm font-bold text-ws-accent">
                            {nickname}
                          </p>
                        )}
                        {affiliation && (
                          <p className="mt-1 truncate text-xs text-ws-muted">
                            {affiliation}
                          </p>
                        )}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {(["pre", "day1", "homework", "day2"] as const).map((phase) => (
                          <span
                            key={phase}
                            className={cn(
                              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-caption font-medium",
                              done.includes(phase)
                                ? "bg-ws-mint text-ws-teal"
                                : "bg-ws-fill text-ws-muted"
                            )}
                          >
                            {done.includes(phase) && <Check className="h-2.5 w-2.5" />}
                            {PHASE_LABEL[phase]}
                          </span>
                        ))}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </PrintSheet>
      </WorksheetStage>
    </>
  );
}

const PHASE_LABEL: Record<"pre" | "day1" | "homework" | "day2", string> = {
  pre: "事前",
  day1: "Day1",
  homework: "宿題",
  day2: "Day2",
};
