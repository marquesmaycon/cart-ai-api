import { Module } from '@nestjs/common'
import { CatalogService } from './catalog.service'
import { CatalogController } from './catalog.controller'
import { PrismaModule } from 'src/prisma/prisma.module'
import { LlmService } from 'src/llm/llm.service'

@Module({
  controllers: [CatalogController],
  providers: [CatalogService, LlmService],
  imports: [PrismaModule]
})
export class CatalogModule {}
