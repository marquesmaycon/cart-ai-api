import { Injectable, OnModuleInit, type OnModuleDestroy } from '@nestjs/common'

import { PrismaClient } from 'generated/prisma'

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}
