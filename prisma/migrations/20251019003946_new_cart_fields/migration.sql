-- AlterTable
ALTER TABLE "carts" ADD COLUMN     "score" INTEGER,
ADD COLUMN     "suggested_by_message_id" INTEGER;

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_suggested_by_message_id_fkey" FOREIGN KEY ("suggested_by_message_id") REFERENCES "chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
