import { notFound } from "next/navigation";
import { formatHeaderName } from "@/components/worksheet/SheetHeader";
import { loadParticipantForView } from "../../_lib";
import { ViewHeader } from "../../ViewHeader";
import { isSheetId } from "../../sheets";
import { SheetView } from "./SheetView";
import type { Slide } from "@/app/workshop/pre/profile-slide/_types";
import type { LifeCurvePoint } from "@/app/workshop/pre/life-plan/_types";
import type { ExcursionData } from "@/lib/homework/excursion/types";

/**
 * 受講生ビュー（運営が見る）の各シート。
 * 表示はすべて受講生本人と同じコンポーネントで、読み取り専用。
 * 受講生ごとのデータはクライアント側が participantId で読む
 * （lib/workshopSource.ts）。サーバーで渡すのは、
 * クライアントが自力で取れない事前課題・プチ越境の中身だけ。
 */
export default async function ParticipantViewSheetPage({
  params,
}: {
  params: { sessionId: string; userId: string; sheet: string };
}) {
  if (!isSheetId(params.sheet)) notFound();

  const { user } = await loadParticipantForView(params.sessionId, params.userId);
  // シートからの「戻る」は、その受講生のポータルへ（受講生の導線と同じ一段戻り）
  const backTo = `/view/${params.sessionId}/${params.userId}`;

  const pre = user.workshopData?.pre as
    | { profileSlide?: Slide; lifeCurve?: { points?: LifeCurvePoint[] } }
    | null;
  const excursion = (user.workshopData?.homework as { excursion?: ExcursionData } | null)
    ?.excursion;

  const headerName = formatHeaderName(
    (pre?.profileSlide?.name ?? user.name ?? "").trim(),
    (pre?.profileSlide?.nickname ?? "").trim()
  );

  return (
    <>
      <ViewHeader
        backTo={backTo}
        backLabel="この受講生のワーク一覧へ"
        note={`${user.name ?? user.email} さんの画面`}
      />
      <SheetView
      sheet={params.sheet}
      participantId={user.id}
      headerName={headerName}
      slide={pre?.profileSlide}
      lifeCurvePoints={pre?.lifeCurve?.points ?? []}
      excursionDecisionSummary={excursion?.decision?.summary ?? null}
        excursionReport={excursion?.report}
      />
    </>
  );
}
