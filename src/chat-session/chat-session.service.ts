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
import type { SuggestedCartsSchema } from 'src/llm/schemas'

export type RelevantsProducts = {
  store_id: number
  products: { id: number; name: string; similarity: number }[]
}

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

    await this.prisma.chatMessageAction.update({
      where: { id: actionId },
      data: { confirmedAt: new Date() }
    })

    if (action.actionType === 'SUGGEST_CART') {
      const actionPayload = JSON.stringify(action.payload)

      const embedding = await this.llmService.embedInput(actionPayload)

      if (!embedding) {
        throw new BadGatewayException('Failed to generate embedding')
      }

      const stringifiedEmbedding = JSON.stringify(embedding.values)

      const relevantProducts = await this.prisma.$queryRaw<RelevantsProducts[]>`
        SELECT store_id, JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', id,
            'name', name,
            'similarity', embedding::vector <=> ${stringifiedEmbedding}::vector
          )
        ) as products
        FROM products p
        WHERE embedding::vector <=> ${stringifiedEmbedding}::vector < 0.65
        GROUP BY store_id
        LIMIT 5;
      `

      const llmResponse = await this.llmService.suggestCarts(
        relevantProducts,
        actionPayload
      )

      if (!llmResponse) {
        throw new BadGatewayException(
          'Failed to get a response from LLM service'
        )
      }

      await this.prisma.chatMessageAction.update({
        where: { id: actionId },
        data: { executedAt: new Date() }
      })

      const chatMessage = await this.addMessageToSession({
        chatSessionId: chatSession.id,
        content: llmResponse.response,
        sender: 'ASSISTANT',
        messageType: 'SUGGESTION',
        geminiMessageId: llmResponse.responseId
      })

      await this.saveSuggestedCarts(String(chatMessage.id), llmResponse)
    } else {
      throw new InternalServerErrorException('Unknown action type')
    }
  }

  private async saveSuggestedCarts(
    messageId: string,
    suggestion: SuggestedCartsSchema
  ) {
    const user = await this.prisma.user.findFirstOrThrow({
      where: {
        chatSessions: { some: { messages: { some: { id: +messageId } } } }
      }
    })

    await this.prisma.$transaction(
      suggestion.carts.map(({ store_id: storeId, score, products }) => {
        return this.prisma.cart.create({
          data: {
            userId: user.id,
            storeId,
            active: false,
            score,
            suggestedByMessageId: +messageId,
            items: {
              createMany: {
                data: products.map(({ id, quantity }) => ({
                  productId: id,
                  quantity
                }))
              }
            }
          }
        })
      })
    )
  }

  update(id: number, updateChatSessionDto: UpdateChatSessionDto) {
    return `This action updates a #${id} chatSession`
  }

  remove(id: number) {
    return `This action removes a #${id} chatSession`
  }
}
