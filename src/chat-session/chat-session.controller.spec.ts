import { Test, TestingModule } from '@nestjs/testing'

import { ChatSessionController } from './chat-session.controller'
import { ChatSessionService } from './chat-session.service'
import { PrismaModule } from 'src/prisma/prisma.module'
import { PrismaService } from 'src/prisma/prisma.service'

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
})
