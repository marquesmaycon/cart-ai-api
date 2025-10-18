import { Injectable } from '@nestjs/common'
import type { Product } from 'generated/prisma'
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

    const products = await this.prisma.$queryRaw<Product[]>`
      SELECT id, name
      FROM products
      WHERE embedding IS NULL
    `

    if (!products.length) return

    const embeddings = await this.llmService.batchEmbedInputs(products)
    if (!embeddings) return

    await this.prisma.$transaction(
      embeddings.map(
        ({ values }, index) =>
          this.prisma.$executeRaw`
          UPDATE products
          SET embedding = ${JSON.stringify(values)}::vector
          WHERE id = ${products[index].id}
        `
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
