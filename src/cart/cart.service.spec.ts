import { Test, TestingModule } from '@nestjs/testing'
import { CartService } from './cart.service'
import { PrismaModule } from 'src/prisma/prisma.module'

describe('CartService', () => {
  let service: CartService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CartService],
      imports: [PrismaModule]
    }).compile()

    service = module.get<CartService>(CartService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
