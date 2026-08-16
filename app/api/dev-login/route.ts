import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";

/**
 * 開発環境専用：実メール受信ができないプレビュー画面から確認作業を進めるための
 * ログイン補助エンドポイント。本番(NODE_ENV=production)では常に404にする。
 * 事前登録済みメールアドレスに対して、magic link相当のtoken_hashを発行する
 * （ブラウザ側で auth.verifyOtp に渡してセッションを確立する）。
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email) {
    return NextResponse.json({ error: "メールアドレスを入力してください。" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) {
    return NextResponse.json(
      { error: "このメールアドレスは登録されていません。" },
      { status: 404 }
    );
  }

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (error || !data?.properties?.hashed_token) {
    console.error("dev-login generateLink:", error);
    return NextResponse.json({ error: "リンクの発行に失敗しました。" }, { status: 500 });
  }

  // action_link の type= クエリで signup / magiclink を判定（既存認証ユーザーかどうかでSupabaseが自動選択する）
  const actionUrl = new URL(data.properties.action_link);
  const verifyType = actionUrl.searchParams.get("type") ?? "magiclink";

  return NextResponse.json({
    tokenHash: data.properties.hashed_token,
    verifyType,
  });
}
