import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import { linkOrCreateUserForAuthId } from "@/lib/auth";

/**
 * /auth/callback がコード交換に成功した直後に呼ぶ。
 * 今の Supabase セッションの email を public.users と紐付け（無ければ作成）、
 * role を app_metadata に同期する。
 */
export async function POST() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json({ error: "セッションが確認できません。" }, { status: 401 });
  }

  try {
    const linked = await linkOrCreateUserForAuthId({ authUserId: user.id, email: user.email });
    return NextResponse.json({
      user: { id: linked.id, email: user.email, role: linked.role },
    });
  } catch (e) {
    console.error("auth/link:", e);
    return NextResponse.json({ error: "アカウントの紐付けに失敗しました。" }, { status: 500 });
  }
}
