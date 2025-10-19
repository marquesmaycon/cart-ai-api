import { Controller, Get, Post, Body, Param } from '@nestjs/common'

import { ChatSessionService } from './chat-session.service'

@Controller('chat-sessions')
export class ChatSessionController {
  constructor(private readonly chatSessionService: ChatSessionService) {}

  @Post()
  create() {
    const userId = 1
    return this.chatSessionService.create({ userId })
  }

  @Get()
  findAll() {
    return this.chatSessionService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.chatSessionService.findOne(+id)
  }

  @Post(':id/messages')
  async addUserMessage(
    @Param('id') id: string,
    @Body('content') content: string
  ) {
    return await this.chatSessionService.addUserMessage(+id, content)
  }

  @Post(':chatSessionId/actions/:actionId/confirm')
  async confirmAction(
    @Param('chatSessionId') chatSessionId: string,
    @Param('actionId') actionId: string
  ) {
    return await this.chatSessionService.confirmAction(
      +chatSessionId,
      +actionId
    )
  }
}
