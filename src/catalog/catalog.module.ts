import { Module } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CatalogController } from './catalog.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [CatalogController],
  providers: [CatalogService],
  imports: [PrismaModule],
})
export class CatalogModule {}
