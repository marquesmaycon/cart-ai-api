-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('SUGGEST_CART');

-- CreateTable
CREATE TABLE "chat_message_actions" (
    "id" SERIAL NOT NULL,
    "action_type" "ActionType" NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed_at" TIMESTAMP(3),
    "executed_at" TIMESTAMP(3),
    "chat_message_id" INTEGER NOT NULL,

    CONSTRAINT "chat_message_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chat_message_actions_chat_message_id_action_type_key" ON "chat_message_actions"("chat_message_id", "action_type");

-- AddForeignKey
ALTER TABLE "chat_message_actions" ADD CONSTRAINT "chat_message_actions_chat_message_id_fkey" FOREIGN KEY ("chat_message_id") REFERENCES "chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
