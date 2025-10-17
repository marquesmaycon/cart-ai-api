import { Injectable } from '@nestjs/common'

import { CreateChatSessionDto } from './dto/create-chat-session.dto'
import { UpdateChatSessionDto } from './dto/update-chat-session.dto'
import { PrismaService } from 'src/prisma/prisma.service'
import type { CreateChatMessageDto } from './dto/create-chat-message.dto'

@Injectable()
export class ChatSessionService {
  constructor(private prisma: PrismaService) {}

  async create({ userId }: CreateChatSessionDto) {
    return await this.prisma.chatSession.create({
      data: { userId }
    })
  }

  findAll() {
    return `This action returns all chatSession`
  }

  async findOne(id: number) {
    return await this.prisma.chatSession.findUnique({
      where: { id },
      include: { messages: true }
    })
  }

  async addUserMessage(sessionId: number, content: string) {
    await this.addMessageToSession({ chatSessionId: sessionId, content })
    return await this.findOne(sessionId)
  }

  private async addMessageToSession(
    createChatMessageDto: CreateChatMessageDto
  ) {
    return await this.prisma.chatMessage.create({ data: createChatMessageDto })
  }

  update(id: number, updateChatSessionDto: UpdateChatSessionDto) {
    return `This action updates a #${id} chatSession`
  }

  remove(id: number) {
    return `This action removes a #${id} chatSession`
  }
}
