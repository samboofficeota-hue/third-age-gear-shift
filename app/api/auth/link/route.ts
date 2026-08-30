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

    // 招待制。事前登録の無いアドレスはアカウントを作らず、Supabase セッションも捨てる。
    // （同じ Supabase プロジェクトを姉妹サービスと共用しているため、auth.users には
    //   この講座と無関係の会員が居る。ここで受講者かどうかを切り分ける。）
    if (!linked) {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: "このメールアドレスは、この講座に登録されていません。事務局までお問い合わせください。" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      user: { id: linked.id, email: user.email, role: linked.role },
    });
  } catch (e) {
    console.error("auth/link:", e);
    return NextResponse.json({ error: "アカウントの紐付けに失敗しました。" }, { status: 500 });
  }
}
