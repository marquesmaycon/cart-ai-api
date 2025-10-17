import { Module } from '@nestjs/common'
import { ChatSessionService } from './chat-session.service'
import { ChatSessionController } from './chat-session.controller'
import { PrismaService } from 'src/prisma/prisma.service'

@Module({
  controllers: [ChatSessionController],
  providers: [ChatSessionService, PrismaService]
})
export class ChatSessionModule {}
