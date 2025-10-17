-- AlterTable
ALTER TABLE "chat_messages" ALTER COLUMN "sender" SET DEFAULT 'USER',
ALTER COLUMN "gemini_message_id" DROP NOT NULL;
