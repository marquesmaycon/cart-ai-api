import { Injectable } from '@nestjs/common'

import { CreateCartDto } from './dto/create-cart.dto'
import { UpdateCartDto } from './dto/update-cart.dto'
import { PrismaService } from 'src/prisma/prisma.service'

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async create(createCartDto: CreateCartDto) {
    const { userId, productId, quantity } = createCartDto

    const product = await this.prisma.product.findFirstOrThrow({
      where: { id: productId }
    })

    const existingCart = await this.prisma.cart.findFirst({
      where: { userId, active: true }
    })

    if (existingCart?.storeId === product.storeId) {
      await this.prisma.cartItem.create({
        data: {
          cartId: existingCart.id,
          productId,
          quantity
        }
      })
    } else {
      await this.prisma.cart.create({
        data: {
          userId: userId,
          storeId: product.storeId,
          items: { create: { productId, quantity } }
        }
      })

      if (existingCart) {
        await this.prisma.cart.update({
          where: { id: existingCart.id },
          data: { active: false }
        })
      }
    }

    const cart = await this.prisma.cart.findFirst({
      where: { userId, active: true },
      include: {
        items: {
          select: {
            quantity: true,
            product: { select: { id: true, name: true, price: true } }
          }
        }
      }
    })

    return cart
  }

  findAll() {
    return `This action returns all cart`
  }

  async findOne(userId: number) {
    return await this.prisma.cart.findFirst({
      where: { active: true, userId },
      include: { items: true }
    })
  }

  async update(id: number, updateCartDto: UpdateCartDto) {
    const { productId, quantity } = updateCartDto

    const activeCart = await this.prisma.cart.findFirstOrThrow({
      where: { userId: id, active: true },
      include: { items: { select: { productId: true } } }
    })

    if (!activeCart.items.some((item) => item.productId === productId)) {
      throw new Error('Product not found in cart')
    }

    await this.prisma.cartItem.update({
      where: {
        cartId_productId: { cartId: activeCart.id, productId }
      },
      data: { quantity },
      include: { product: true }
    })

    return await this.prisma.cart.findFirstOrThrow({
      where: { id: activeCart.id },
      include: {
        items: {
          select: {
            productId: true,
            quantity: true,
            product: { select: { id: true } }
          }
        }
      }
    })
  }

  remove(id: number) {
    return `This action removes a #${id} cart`
  }
}
