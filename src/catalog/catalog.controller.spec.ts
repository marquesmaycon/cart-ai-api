import { Test, TestingModule } from '@nestjs/testing';

import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { PrismaModule } from 'src/prisma/prisma.module';

describe('CatalogController', () => {
  let controller: CatalogController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CatalogController],
      providers: [CatalogService],
      imports: [PrismaModule],
    }).compile();

    controller = module.get<CatalogController>(CatalogController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return catalog items', async () => {
    const catalog = await controller.getCatalog();
    expect(catalog).toHaveLength(36);
  });
});
