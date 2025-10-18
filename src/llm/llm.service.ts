import { GoogleGenerativeAI, TaskType, type Part } from '@google/generative-ai'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
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

  constructor(private readonly configService: ConfigService) {
    this.ai = new GoogleGenerativeAI(
      this.configService.get<string>('GEMINI_API_KEY') || ''
    )
  }

  async answerMessage(message: string) {
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
      //   // Adicionar o histórico da conversa aqui, se aplicável, para manter o contexto.
      //   // Por enquanto, vamos manter simples.
      // })

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
      console.log('LlmService.embedInput called with input', input)

      const content: Part = { text: input }

      console.log({ content })

      const result = await this.ai
        .getGenerativeModel({ model: 'text-embedding-004' })
        .embedContent({
          content: { parts: [content], role: 'user' },
          taskType: TaskType.RETRIEVAL_DOCUMENT
        })

      console.log('embedding length:', result.embedding.values.length) // 768

      return result.embedding
    } catch (error) {
      console.error('Error in LlmService.embedInput:', error)
      return null
    }
  }
}
