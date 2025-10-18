import { GoogleGenerativeAI, TaskType } from '@google/generative-ai'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { Product } from 'generated/prisma'
import { z } from 'zod'

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

@Injectable()
export class LlmService {
  static readonly ANSWER_MESSAGE_PROMPT = `
    Você é um assistente de um marketplace com conhecimentos gastronômicos.
    Sua tarefa é analisar a mensagem do usuário e retornar um objeto JSON estritamente no formato definido abaixo.
    
    Ações disponíveis:
    - 'TEXT': Use essa ação para responder ao usuário com uma mensagem.
      Use esta ação se você precisar de mais informações do usuário ou se a solicitação for apenas uma pergunta.
      No campo 'message', informe a resposta do assistente ao usuário.
    - 'SUGGEST_CART': Use essa ação apenas quando já tiver todas as informações necessárias para sugerir um carrinho de compras.
      No campo 'message', informe uma confirmação para o usuário, perguntando se ele confirma a ação de montar o carrinho de compras.
      No campo 'input' do payload, forneça uma descrição do que o usuário está solicitando, junto a uma lista de produtos que você sugeriria para o carrinho.

    Exemplo de formato JSON para 'TEXT':
    {
      "message": "Qual é a receita que você gostaria de ver?",
      "action": { "type": "TEXT" }
    }

    Exemplo de formato JSON para 'SUGGEST_CART':
    {
      "message": "Você solicitou um bolo de chocolate. Confirma a ação para que eu possa montar o carrinho de compras?",
      "action": {
        "type": "SUGGEST_CART",
        "payload": {
          "input": "Bolo de chocolate. Ingredientes: farinha, açúcar, ovos, chocolate meio amargo, fermento em pó."
        }
      }
    }

    INSTRUÇÕES CRÍTICAS:
    - Responda APENAS com o objeto JSON. Não inclua texto explicativo antes ou depois.
    - O objeto JSON deve corresponder exatamente ao schema fornecido nos exemplos.
    - Não precisa ir muito a fundo em detalhes; se o usuário solicitar um bolo de chocolate, sugira ingredientes básicos.
  `
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
        ${LlmService.ANSWER_MESSAGE_PROMPT}

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
