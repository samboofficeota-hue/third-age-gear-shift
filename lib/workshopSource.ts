/**
 * ワークシートの各シート部品が「誰のデータを読むか」を決める。
 *
 * 受講生本人の画面では自分のデータ（/api/workshop/me）。
 * 講師画面の投影ビューでは、指定した受講生のデータを読む。
 * シート部品は本人用も投影用も**同じコード**を使うので、
 * 読み込み先だけをここで切り替える（見た目の差を作らないため）。
 *
 * 投影側は閲覧専用。保存系（PATCH /api/workshop/me/*）は viewOnly のとき
 * 実行されないので、切り替えるのは読み込みだけでよい。
 */
export function workshopDataEndpoint(participantId?: string | null): string {
  return participantId
    ? `/api/admin/participants/${participantId}/workshop`
    : "/api/workshop/me";
}
