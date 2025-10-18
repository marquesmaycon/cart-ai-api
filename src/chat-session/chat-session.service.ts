import {
  BadGatewayException,
  ConflictException,
  Injectable,
  InternalServerErrorException
} from '@nestjs/common'

import { CreateChatSessionDto } from './dto/create-chat-session.dto'
import { UpdateChatSessionDto } from './dto/update-chat-session.dto'
import { PrismaService } from 'src/prisma/prisma.service'
import type { CreateChatMessageDto } from './dto/create-chat-message.dto'
import { LlmService } from 'src/llm/llm.service'

@Injectable()
export class ChatSessionService {
  constructor(
    private prisma: PrismaService,
    private llmService: LlmService
  ) {}

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
      include: { messages: { include: { actions: true } } }
    })
  }

  async addUserMessage(chatSessionId: number, content: string) {
    await this.addMessageToSession({ chatSessionId, content })

    const llmResponse = await this.llmService.answerMessage(content)

    if (!llmResponse) {
      throw new BadGatewayException('Failed to get a response from LLM service')
    }

    const chatMessage = await this.addMessageToSession({
      chatSessionId,
      content: llmResponse.message,
      sender: 'ASSISTANT',
      messageType: 'TEXT',
      geminiMessageId: llmResponse.responseId
    })

    if (llmResponse.action.type === 'SUGGEST_CART') {
      await this.prisma.chatMessageAction.create({
        data: {
          chatMessageId: chatMessage.id,
          actionType: llmResponse.action.type,
          payload: JSON.stringify(llmResponse.action.payload.input)
        }
      })
    }

    return await this.findOne(chatSessionId)
  }

  private async addMessageToSession(
    createChatMessageDto: CreateChatMessageDto
  ) {
    return await this.prisma.chatMessage.create({ data: createChatMessageDto })
  }

  async confirmAction(chatSessionId: number, actionId: number) {
    const action = await this.prisma.chatMessageAction.findUniqueOrThrow({
      where: { id: actionId }
    })

    const chatSession = await this.prisma.chatSession.findUniqueOrThrow({
      where: { id: chatSessionId }
    })

    if (action.confirmedAt) {
      throw new ConflictException('Action already confirmed')
    }

    if (action.actionType === 'SUGGEST_CART') {
      console.log('action payload', action.payload)

      const embedding = await this.llmService.embedInput(
        JSON.stringify(action.payload) || ''
      )

      if (!embedding) {
        throw new BadGatewayException('Failed to generate embedding')
      }

      const stringifiedEmbedding = JSON.stringify(embedding.values)

      const relevantProducts = await this.prisma.$queryRaw`
        SELECT store_id, JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', id,
            'name', name,
            -- 'price', price
            'similarity', embedding <=> ${stringifiedEmbedding}
          )
        ) as products
        FROM products p
        WHERE embedding <=> ${stringifiedEmbedding} < 0.65
        GROUP BY store_id
        LIMIT 5;
      `

      console.dir(JSON.stringify(relevantProducts, null, 2))
    } else {
      throw new InternalServerErrorException('Unknown action type')
    }
  }

  update(id: number, updateChatSessionDto: UpdateChatSessionDto) {
    return `This action updates a #${id} chatSession`
  }

  remove(id: number) {
    return `This action removes a #${id} chatSession`
  }
}
