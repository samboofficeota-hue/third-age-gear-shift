import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

/**
 * 講師画面の投影ビュー用。指定した受講生の WorkshopData を返す。
 *
 * レスポンスの形は `/api/workshop/me` と **同一**にしてある。
 * ワークシートの各シート部品（Day1Client など）は受講生本人の画面と
 * まったく同じコードを使うので、読み込み先だけ差し替えれば動く。
 * 形が変わると投影だけ壊れるため、me 側を変えるときはここも合わせること。
 *
 * 閲覧専用。ここには更新系を作らない（講師の誤操作で受講生の入力を壊さない）。
 * 講師は自分の担当セッションの受講生だけを見られる（sessionScopeFor）。
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const user = await prisma.user.findFirst({
    where: {
      id: params.id,
      role: "participant",
    },
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
      organization: { select: { name: true } },
      workshopData: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "受講生が見つかりません。" }, { status: 404 });
  }

  const wd = user.workshopData;

  return NextResponse.json({
    account: {
      name: user.name,
      department: user.department,
      organizationName: user.organization?.name ?? null,
    },
    workshopData: wd
      ? {
          id: wd.id,
          sessionId: wd.sessionId,
          profile: wd.profile,
          pre: wd.pre,
          day1: wd.day1,
          homework: wd.homework,
          day2: wd.day2,
          post: wd.post,
          completedPhases: wd.completedPhases,
          lastUpdated: wd.lastUpdated,
        }
      : // まだ1度も保存していない受講生。空で返す（シート側は未入力として描画する）
        {
          id: null,
          sessionId: null,
          profile: null,
          pre: null,
          day1: null,
          homework: null,
          day2: null,
          post: null,
          completedPhases: [],
          lastUpdated: null,
        },
  });
}
