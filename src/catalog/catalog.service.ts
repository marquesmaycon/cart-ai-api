import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  async getCatalog(search?: string) {
    return await this.prisma.product.findMany({
      include: {
        store: true,
      },
      where: {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      },
    });
  }
}
