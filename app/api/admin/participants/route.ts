import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, resolveSession } from "@/lib/adminAuth";

/**
 * 受講生名簿（A-1 / F-1）。
 * 講師は担当セッションのみ（resolveSession が担当外IDを弾く）。
 */

type PreData = {
  survey?: Record<string, unknown> | null;
  profileSlide?: {
    name?: string;
    nickname?: string;
    photo?: string;
    points?: string[];
    history?: { year?: string; event?: string }[];
  } | null;
};

function hasSurveyAnswers(pre: PreData | null): boolean {
  const survey = pre?.survey;
  if (!survey || typeof survey !== "object") return false;
  return Object.values(survey).some((v) =>
    Array.isArray(v) ? v.length > 0 : v !== null && v !== undefined && v !== ""
  );
}

function firstNonEmpty(...values: (string | null | undefined)[]): string | null {
  for (const v of values) {
    if (v && v.trim()) return v.trim();
  }
  return null;
}

/** じぶん紹介が「書かれている」判定（/training/intro の hasData と同じ基準） */
function hasProfileSlide(pre: PreData | null): boolean {
  const s = pre?.profileSlide;
  if (!s) return false;
  return !!(
    s.name?.trim() ||
    s.nickname?.trim() ||
    s.photo?.trim() ||
    (s.points ?? []).some((p) => p?.trim()) ||
    (s.history ?? []).some((h) => h.event?.trim())
  );
}

export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(request.url);
  const requestedSessionId = searchParams.get("sessionId");

  const workshopSession = await resolveSession(requestedSessionId);
  if (requestedSessionId && !workshopSession) {
    return NextResponse.json(
      { error: "セッションが見つからないか、閲覧権限がありません。" },
      { status: 404 }
    );
  }

  const users = await prisma.user.findMany({
    where: {
      role: "participant",
      ...(workshopSession ? { workshopData: { sessionId: workshopSession.id } } : {}),
    },
    include: {
      organization: { select: { name: true } },
      workshopData: {
        select: {
          completedPhases: true,
          lastUpdated: true,
          profile: true,
          pre: true,
          sessionId: true,
          attendanceDay1: true,
          attendanceDay2: true,
          completedAt: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    sessionId: workshopSession?.id ?? null,
    participants: users.map((u) => {
      const wd = u.workshopData;
      const profile = wd?.profile as Record<string, unknown> | null;
      const pre = (wd?.pre as PreData | null) ?? null;
      return {
        id: u.id,
        email: u.email,
        // じぶん紹介の名前 → プロフィール → 事前登録名 の順で拾う
        name: firstNonEmpty(
          pre?.profileSlide?.name,
          profile?.name as string | undefined,
          u.name
        ),
        department: u.department,
        organizationName: u.organization?.name ?? null,
        inviteStatus: u.activatedAt
          ? "activated"
          : u.inviteToken
            ? "invited"
            : "none",
        invitedAt: u.invitedAt,
        activatedAt: u.activatedAt,
        completedPhases: wd?.completedPhases ?? [],
        lastUpdated: wd?.lastUpdated ?? null,
        preSurveyDone: hasSurveyAnswers(pre),
        profileSlideDone: hasProfileSlide(pre),
        attendanceDay1: wd?.attendanceDay1 ?? null,
        attendanceDay2: wd?.attendanceDay2 ?? null,
        completedAt: wd?.completedAt ?? null,
      };
    }),
  });
}
