import { Test, TestingModule } from '@nestjs/testing'

import { ChatSessionController } from './chat-session.controller'
import { ChatSessionService } from './chat-session.service'
import { PrismaModule } from 'src/prisma/prisma.module'
import { PrismaService } from 'src/prisma/prisma.service'
import { MessageSender, MessageType } from 'generated/prisma'

describe('ChatSessionController', () => {
  let controller: ChatSessionController
  let prisma: PrismaService

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatSessionController],
      providers: [ChatSessionService],
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

    const messageContent = 'Hello, this is a user message.'
    const message = await controller.addUserMessage(
      chatSession.id.toString(),
      messageContent
    )

    expect(message).toEqual(
      expect.objectContaining({
        chatSessionId: chatSession.id,
        content: messageContent,
        sender: MessageSender.USER,
        messageType: MessageType.TEXT,
        geminiMessageId: null
      })
    )
  })
})
