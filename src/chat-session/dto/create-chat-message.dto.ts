import type { MessageSender, MessageType } from 'generated/prisma'

export class CreateChatMessageDto {
  chatSessionId: number

  content: string

  sender?: MessageSender = 'USER'

  geminiMessageId?: string | null = null

  messageType?: MessageType = 'TEXT'
}
