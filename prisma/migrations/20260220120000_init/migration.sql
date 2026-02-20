-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'facilitator', 'participant');

-- CreateEnum
CREATE TYPE "BlockStatusEnum" AS ENUM ('LOCKED', 'PREVIEW', 'OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "ParticipantOverrideStatus" AS ENUM ('LOCKED', 'OPEN');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'participant',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workshop_data" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT,
    "profile" JSONB,
    "step1" JSONB,
    "step2" JSONB,
    "step3" JSONB,
    "step4" JSONB,
    "step5" JSONB,
    "step6" JSONB,
    "step7" JSONB,
    "michi_dialogues" JSONB,
    "completed_blocks" TEXT[],
    "last_updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workshop_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workshop_sessions" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workshop_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "block_status" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "block_id" TEXT NOT NULL,
    "status" "BlockStatusEnum" NOT NULL DEFAULT 'LOCKED',
    "opened_at" TIMESTAMP(3),
    "opened_by" TEXT,
    "auto_close_at" TIMESTAMP(3),

    CONSTRAINT "block_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participant_block_override" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "block_id" TEXT NOT NULL,
    "status" "ParticipantOverrideStatus" NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "participant_block_override_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "workshop_data_user_id_key" ON "workshop_data"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "block_status_session_id_block_id_key" ON "block_status"("session_id", "block_id");

-- CreateIndex
CREATE UNIQUE INDEX "participant_block_override_user_id_block_id_key" ON "participant_block_override"("user_id", "block_id");

-- AddForeignKey
ALTER TABLE "workshop_data" ADD CONSTRAINT "workshop_data_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "block_status" ADD CONSTRAINT "block_status_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "workshop_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participant_block_override" ADD CONSTRAINT "participant_block_override_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

