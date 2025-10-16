import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CatalogController } from './catalog/catalog.controller';
import { CatalogService } from './catalog/catalog.service';
import { CatalogModule } from './catalog/catalog.module';

@Module({
  imports: [CatalogModule, ConfigModule.forRoot({ isGlobal: true })],
  controllers: [AppController, CatalogController],
  providers: [AppService, CatalogService],
})
export class AppModule {}
