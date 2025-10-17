import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { AppController } from './app.controller'
import { AppService } from './app.service'
import { CatalogController } from './catalog/catalog.controller'
import { CatalogService } from './catalog/catalog.service'
import { CatalogModule } from './catalog/catalog.module'
import { PrismaService } from './prisma/prisma.service'
import { PrismaModule } from './prisma/prisma.module'
import { CartModule } from './cart/cart.module'
import { ChatSessionModule } from './chat-session/chat-session.module'
import { LlmService } from './llm/llm.service'

@Module({
  imports: [
    CatalogModule,
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CartModule,
    ChatSessionModule
  ],
  controllers: [AppController, CatalogController],
  providers: [AppService, CatalogService, PrismaService, LlmService]
})
export class AppModule {}
