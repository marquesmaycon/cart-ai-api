import { Injectable } from '@nestjs/common'

import { CreateChatSessionDto } from './dto/create-chat-session.dto'
import { UpdateChatSessionDto } from './dto/update-chat-session.dto'
import { PrismaService } from 'src/prisma/prisma.service'

@Injectable()
export class ChatSessionService {
  constructor(private prisma: PrismaService) {}

  async create({ userId }: CreateChatSessionDto) {
    const chat = await this.prisma.chatSession.create({
      data: {
        userId
      }
    })

    return chat
  }

  findAll() {
    return `This action returns all chatSession`
  }

  async findOne(id: number) {
    return await this.prisma.chatSession.findUnique({
      where: { id }
    })
  }

  update(id: number, updateChatSessionDto: UpdateChatSessionDto) {
    return `This action updates a #${id} chatSession`
  }

  remove(id: number) {
    return `This action removes a #${id} chatSession`
  }
}
