import { Module } from '@nestjs/common'
import { ChatSessionService } from './chat-session.service'
import { ChatSessionController } from './chat-session.controller'
import { PrismaService } from 'src/prisma/prisma.service'
import { LlmService } from 'src/llm/llm.service'

@Module({
  controllers: [ChatSessionController],
  providers: [ChatSessionService, PrismaService, LlmService]
})
export class ChatSessionModule {}
