import { Injectable } from '@nestjs/common'
import { LlmService } from 'src/llm/llm.service'

import { PrismaService } from 'src/prisma/prisma.service'

@Injectable()
export class CatalogService {
  constructor(
    private prisma: PrismaService,
    private llmService: LlmService
  ) {}

  private _hasRunEmbbedingBatch = false

  async onApplicationBootstrap() {
    if (this['_hasRunEmbbedingBatch']) return
    this['_hasRunEmbbedingBatch'] = true

    const products = await this.prisma.product.findMany({
      where: {
        OR: [{ embedding: { equals: null } }, { embedding: { isEmpty: true } }]
      }
    })

    if (!products.length) return

    const embeddings = await this.llmService.batchEmbedInputs(products)
    if (!embeddings) return

    await this.prisma.$transaction(
      embeddings.map(({ values }, index) =>
        this.prisma.product.update({
          where: { id: products[index].id },
          data: { embedding: values }
        })
      )
    )
  }

  async getCatalog(search?: string) {
    return await this.prisma.product.findMany({
      include: { store: true },
      where: {
        name: {
          contains: search,
          mode: 'insensitive'
        }
      }
    })
  }
}
