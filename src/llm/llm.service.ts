import { GoogleGenerativeAI, TaskType } from '@google/generative-ai'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import type { Product } from 'generated/prisma'
import { ANSWER_MESSAGE_PROMPT, SUGGEST_CARTS_PROMPT } from './prompts'
import type { RelevantsProducts } from 'src/chat-session/chat-session.service'
import { answerMessageSchema, suggestCartsSchema } from './schemas'

@Injectable()
export class LlmService {
  readonly ANSWER_MESSAGE_PROMPT = ANSWER_MESSAGE_PROMPT
  readonly SUGGEST_CARTS_PROMPT = SUGGEST_CARTS_PROMPT

  private ai: GoogleGenerativeAI
  private model = 'gemini-2.5-flash'
  private embeddingModel = 'text-embedding-004'

  constructor(private readonly configService: ConfigService) {
    this.ai = new GoogleGenerativeAI(
      this.configService.get<string>('GEMINI_API_KEY') || ''
    )
  }

  async answerMessage(message: string, history?: string[]) {
    try {
      console.log('LlmService.answerMessage called with message:', message)

      const chat = this.ai.getGenerativeModel({
        model: this.model,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1
        }
      })
      // .startChat({
      //   history:
      //     history?.map((msg) => ({ role: 'user', parts: [{ text: msg }] })) ||
      //     []
      // })
      // .sendMessage({ role: 'user', parts: [{ text: message }] })

      const promptWithUserMessage = `
        ${this.ANSWER_MESSAGE_PROMPT}

        Mensagem do usuário: "${message}"
      `.trim()

      const result = await chat.generateContent({
        contents: [{ role: 'user', parts: [{ text: promptWithUserMessage }] }]
      })

      const responseText = result.response.text()

      if (!responseText) {
        throw new Error('Failed to get a response from Gemini.')
      }

      const parsedOutput = answerMessageSchema.parse(JSON.parse(responseText))

      return { ...parsedOutput, responseId: `gemini-response-${Date.now()}` }
    } catch (error) {
      console.error('Error in LlmService.answerMessage:', error)
      return null
    }
  }

  async suggestCarts(products: RelevantsProducts[], input: string) {
    try {
      const inputWithProducts = `Input do usuário: ${input}\n\nProdutos disponíveis por loja:\n${JSON.stringify(products)}`

      const result = await this.ai
        .getGenerativeModel({
          model: this.model,
          systemInstruction: this.SUGGEST_CARTS_PROMPT,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1
          }
        })
        .generateContent({
          contents: [
            {
              role: 'user',
              parts: [{ text: inputWithProducts }]
            }
          ]
        })
      const responseText = result.response.text()

      if (!responseText) {
        throw new Error('Failed to get a response from Gemini.')
      }

      const parsedOutput = suggestCartsSchema.parse(JSON.parse(responseText))

      return { ...parsedOutput, responseId: `gemini-response-${Date.now()}` }
    } catch (error) {
      console.error('Error in LlmService.suggestCarts:', error)
      return null
    }
  }

  async embedInput(input: string) {
    try {
      // 768 dimensions for text-embedding-004
      const result = await this.ai
        .getGenerativeModel({ model: this.embeddingModel })
        .embedContent({
          content: { parts: [{ text: input }], role: 'user' },
          taskType: TaskType.RETRIEVAL_DOCUMENT
        })

      return result.embedding
    } catch (error) {
      console.error('Error in LlmService.embedInput:', error)
      return null
    }
  }

  async batchEmbedInputs(inputs: Product[]) {
    try {
      const resp = await this.ai
        .getGenerativeModel({ model: this.embeddingModel })
        .batchEmbedContents({
          requests: inputs.map((input) => ({
            content: { parts: [{ text: input.name }], role: 'user' },
            taskType: TaskType.RETRIEVAL_DOCUMENT,
            title: `product-${input.id}`
          }))
        })
      return resp.embeddings
    } catch (error) {
      console.error('Error in LlmService.batchEmbedInputs:', error)
      return null
    }
  }
}
