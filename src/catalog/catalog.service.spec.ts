import { Test, TestingModule } from '@nestjs/testing';

import { CatalogService } from './catalog.service';
import { PrismaModule } from 'src/prisma/prisma.module';

describe('CatalogService', () => {
  let service: CatalogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CatalogService],
      imports: [PrismaModule],
    }).compile();

    service = module.get<CatalogService>(CatalogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
