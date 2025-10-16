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

  it('should return all products', async () => {
    const catalog = await controller.getCatalog();
    expect(catalog).toHaveLength(36);
    expect(catalog[0]).toHaveProperty('store');
  });

  it('should return products for a search query', async () => {
    const searchTerm = 'Feijão';
    const catalog = await controller.getCatalog(searchTerm);

    catalog.forEach((item) => {
      expect(item.name).toMatch(new RegExp(searchTerm, 'i'));
    });
  });
});
