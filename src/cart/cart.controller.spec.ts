import { Test, TestingModule } from '@nestjs/testing'
// import request from 'supertest'

// import { INestApplication } from '@nestjs/common'

import { CartController } from './cart.controller'
import { CartService } from './cart.service'
import { PrismaModule } from 'src/prisma/prisma.module'
import { PrismaService } from 'src/prisma/prisma.service'
// import type { App } from 'supertest/types'
import type { CreateCartDto } from './dto/create-cart.dto'
import type { UpdateCartDto } from './dto/update-cart.dto'

describe('CartController', () => {
  // let app: INestApplication<App>
  let controller: CartController
  let prisma: PrismaService

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartController],
      providers: [CartService],
      imports: [PrismaModule]
    }).compile()

    controller = module.get<CartController>(CartController)
    prisma = module.get<PrismaService>(PrismaService)
    // app = module.createNestApplication()

    // await prisma.$executeRawUnsafe('BEGIN;')
    // await app.init()
  })

  afterEach(async () => {
    await prisma.cartItem.deleteMany()
    await prisma.cart.deleteMany()
  })

  // afterAll(async () => {
  //   await prisma.$executeRawUnsafe('ROLLBACK;')
  //   // await app.close()
  // })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('should create a cart', async () => {
    const payload: CreateCartDto = {
      userId: 1,
      quantity: 1,
      productId: 1
    }

    const cart = await controller.create(payload)

    expect(cart?.items).toContainEqual(
      expect.objectContaining({
        quantity: payload.quantity,
        productId: payload.productId
      })
    )
  })

  it('should stack cart items if the store is the same', async () => {
    const userId = 1

    const payload: CreateCartDto = {
      userId,
      productId: 1,
      quantity: 1
    }

    await controller.create(payload)

    const payload2: CreateCartDto = {
      userId,
      productId: 2,
      quantity: 2
    }

    const cart = await controller.create(payload2)

    expect(cart?.items.length).toBe(2)
    expect(cart?.items).toContainEqual(
      expect.objectContaining({
        quantity: payload.quantity,
        productId: payload.productId
      })
    )
    expect(cart?.items).toContainEqual(
      expect.objectContaining({
        quantity: payload2.quantity,
        productId: payload2.productId
      })
    )
  })

  it('should create a new cart if the store is different', async () => {
    const userId = 1

    const payload: CreateCartDto = {
      userId,
      productId: 1,
      quantity: 1
    }

    await controller.create(payload)

    const payload2: CreateCartDto = {
      userId,
      productId: 17,
      quantity: 2
    }

    const newCart = await controller.create(payload2)

    const cart = await controller.findOne(String(payload.userId))

    expect(cart?.items.length).toBe(newCart?.items.length)
    expect(cart?.items).toContainEqual(
      expect.objectContaining({
        quantity: payload2.quantity,
        productId: payload2.productId
      })
    )
  })

  it('should update cart item quantity', async () => {
    const payload: CreateCartDto = {
      userId: 1,
      productId: 1,
      quantity: 1
    }

    await controller.create(payload)
    await controller.findOne(String(payload.userId))

    const payload2: UpdateCartDto = { ...payload, quantity: 5 }

    const cart = await controller.update(String(payload.userId), payload2)

    expect(cart?.items).toContainEqual(
      expect.objectContaining({
        quantity: payload2.quantity,
        productId: payload2.productId
      })
    )
  })

  it('should remove a item from the cart when quantity is 0', async () => {
    const payload: CreateCartDto = {
      userId: 1,
      productId: 1,
      quantity: 3
    }

    await controller.create(payload)

    const payload2: UpdateCartDto = { ...payload, quantity: 0 }

    const cart = await controller.update(String(payload.userId), payload2)

    expect(cart).toHaveProperty('id')
    expect(cart?.items.length).toBe(0)
  })
})
