import z from 'zod'

const answerMessageSchema = z.object({
  message: z.string(),
  action: z.discriminatedUnion('type', [
    z.object({ type: z.literal('TEXT') }),
    z.object({
      type: z.literal('SUGGEST_CART'),
      payload: z.object({ input: z.string() })
    })
  ])
})

const suggestCartsSchema = z.object({
  carts: z.array(
    z.object({
      store_id: z.number(),
      score: z.number(),
      products: z.array(
        z.object({
          id: z.number(),
          quantity: z.number(),
          name: z.string()
        })
      )
    })
  ),
  response: z.string()
})

type SuggestedCartsSchema = z.infer<typeof suggestCartsSchema>

export { answerMessageSchema, suggestCartsSchema, type SuggestedCartsSchema }
