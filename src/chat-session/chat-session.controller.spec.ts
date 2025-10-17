import { Test, TestingModule } from '@nestjs/testing'

import { MessageSender, MessageType, type ChatMessage } from 'generated/prisma'
import { PrismaModule } from 'src/prisma/prisma.module'
import { PrismaService } from 'src/prisma/prisma.service'
import { ChatSessionService } from './chat-session.service'
import { ChatSessionController } from './chat-session.controller'
import { LlmService } from 'src/llm/llm.service'
import { ConfigService } from '@nestjs/config'

describe('ChatSessionController', () => {
  let controller: ChatSessionController
  let prisma: PrismaService

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatSessionController],
      providers: [ChatSessionService, LlmService, ConfigService],
      imports: [PrismaModule]
    }).compile()

    controller = module.get<ChatSessionController>(ChatSessionController)
    prisma = module.get<PrismaService>(PrismaService)
  })

  afterEach(async () => {
    await prisma.chatSession.deleteMany()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('should create a chat session', async () => {
    const chatSession = await controller.create({ userId: 1 })

    expect(chatSession).toHaveProperty('id')
    expect(chatSession).toHaveProperty('userId', 1)
  })

  it('should add a new user message to chat session', async () => {
    const userId = 1
    const chatSession = await controller.create({ userId })

    expect(chatSession).toHaveProperty('id')
    expect(chatSession).toHaveProperty('userId', userId)

    const messageContent = 'Quero fazer um bolo de chocolate.'
    const updatedChatSession = await controller.addUserMessage(
      chatSession.id.toString(),
      messageContent
    )

    expect(updatedChatSession?.messages).toEqual(
      expect.arrayContaining<Partial<ChatMessage>>([
        expect.objectContaining({
          chatSessionId: chatSession.id,
          content: messageContent,
          sender: MessageSender.USER,
          messageType: MessageType.TEXT,
          geminiMessageId: null
        })
      ])
    )
  })
})
