-- メール送信履歴（P-1 / P-6 / A-2 / F-1）
--
-- ⚠️ このSQLは手書きです。`prisma migrate diff` の自動生成をそのまま使ってはいけません。
--    同じSupabaseプロジェクトに別アプリのテーブル（community_mailing_list / events /
--    event_registrations / marketing_subscribers / survey_responses）が同居しており、
--    自動生成SQL・`prisma db push` はそれらを DROP しようとします。追加分だけを書くこと。

-- CreateEnum
CREATE TYPE "EmailTemplateKey" AS ENUM ('invite', 'reminder_pre', 'completion', 'followup_3m');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('sent', 'failed');

-- CreateTable
CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "template" "EmailTemplateKey" NOT NULL,
    "subject" TEXT NOT NULL,
    "status" "EmailStatus" NOT NULL,
    "provider_id" TEXT,
    "error" TEXT,
    "user_id" TEXT,
    "session_id" TEXT,
    "sent_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_logs_session_id_created_at_idx" ON "email_logs"("session_id", "created_at");

-- CreateIndex
CREATE INDEX "email_logs_user_id_idx" ON "email_logs"("user_id");

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "workshop_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
