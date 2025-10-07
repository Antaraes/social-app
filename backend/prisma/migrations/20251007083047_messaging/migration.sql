-- CreateEnum
CREATE TYPE "public"."MessageStatus" AS ENUM ('SENT', 'DELIVERED', 'READ', 'FAILED');

-- CreateTable
CREATE TABLE "public"."conversations" (
    "id" SERIAL NOT NULL,
    "participant_1" INTEGER NOT NULL,
    "participant_2" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_message_id" INTEGER,
    "last_message_at" TIMESTAMP(3),
    "last_message_text" VARCHAR(255),

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."messages" (
    "id" SERIAL NOT NULL,
    "conversation_id" INTEGER NOT NULL,
    "sender_id" INTEGER NOT NULL,
    "receiver_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "status" "public"."MessageStatus" NOT NULL DEFAULT 'SENT',
    "attachments" JSONB DEFAULT '[]',
    "redis_message_id" VARCHAR(100),
    "delivered_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."message_read_receipts" (
    "id" SERIAL NOT NULL,
    "message_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_read_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conversations_participant_1_updated_at_idx" ON "public"."conversations"("participant_1", "updated_at");

-- CreateIndex
CREATE INDEX "conversations_participant_2_updated_at_idx" ON "public"."conversations"("participant_2", "updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_participant_1_participant_2_key" ON "public"."conversations"("participant_1", "participant_2");

-- CreateIndex
CREATE UNIQUE INDEX "messages_redis_message_id_key" ON "public"."messages"("redis_message_id");

-- CreateIndex
CREATE INDEX "messages_conversation_id_created_at_idx" ON "public"."messages"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "messages_sender_id_idx" ON "public"."messages"("sender_id");

-- CreateIndex
CREATE INDEX "messages_receiver_id_idx" ON "public"."messages"("receiver_id");

-- CreateIndex
CREATE INDEX "messages_status_idx" ON "public"."messages"("status");

-- CreateIndex
CREATE INDEX "message_read_receipts_user_id_idx" ON "public"."message_read_receipts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "message_read_receipts_message_id_user_id_key" ON "public"."message_read_receipts"("message_id", "user_id");

-- AddForeignKey
ALTER TABLE "public"."conversations" ADD CONSTRAINT "conversations_participant_1_fkey" FOREIGN KEY ("participant_1") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conversations" ADD CONSTRAINT "conversations_participant_2_fkey" FOREIGN KEY ("participant_2") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
