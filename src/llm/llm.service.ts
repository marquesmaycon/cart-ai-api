import { GoogleGenerativeAI } from '@google/generative-ai'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { z } from 'zod'

const answerMessageSchema = z.object({
  message: z.string(),
  action: z.discriminatedUnion('type', [
    z.object({ type: z.literal('send_message') }),
    z.object({
      type: z.literal('suggest_cart'),
      payload: z.object({ input: z.string() })
    })
  ])
})

type AnswerMessage = z.infer<typeof answerMessageSchema>

@Injectable()
export class LlmService {
  static readonly ANSWER_MESSAGE_PROMPT = `
    Você é um assistente de um marketplace com conhecimentos gastronômicos.
    Sua tarefa é analisar a mensagem do usuário e retornar um objeto JSON estritamente no formato definido abaixo.
    
    Ações disponíveis:
    - 'send_message': Use essa ação para responder ao usuário com uma mensagem.
      Use esta ação se você precisar de mais informações do usuário ou se a solicitação for apenas uma pergunta.
      No campo 'message', informe a resposta do assistente ao usuário.
    - 'suggest_cart': Use essa ação apenas quando já tiver todas as informações necessárias para sugerir um carrinho de compras.
      No campo 'message', informe uma confirmação para o usuário, perguntando se ele confirma a ação de montar o carrinho de compras.
      No campo 'input' do payload, forneça uma descrição do que o usuário está solicitando, junto a uma lista de produtos que você sugeriria para o carrinho.

    Exemplo de formato JSON para 'send_message':
    {
      "message": "Qual é a receita que você gostaria de ver?",
      "action": { "type": "send_message" }
    }

    Exemplo de formato JSON para 'suggest_cart':
    {
      "message": "Você solicitou um bolo de chocolate. Confirma a ação para que eu possa montar o carrinho de compras?",
      "action": {
        "type": "suggest_cart",
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

  answerMessage = async (message: string) => {
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
      // const result = await chat.sendMessage(promptWithUserMessage)

      console.log('Gemini result', JSON.stringify(result, null, 2))

      const responseText = result.response.text()
      console.log('Raw Gemini response text:', responseText)

      if (!responseText) {
        throw new Error('Failed to get a response from Gemini.')
      }

      // Tenta fazer o parse do texto como JSON
      // Valida com Zod
      const parsedOutput = answerMessageSchema.parse(JSON.parse(responseText))

      // O Gemini API não retorna um 'responseId' como o OpenAI.responses.parse.
      // Você pode gerar um ou usar um placeholder.
      const responseId = `gemini-response-${Date.now()}`

      console.log(
        'LlmService.answerMessage parsed output:',
        JSON.stringify(parsedOutput, null, 2)
      )

      return {
        ...parsedOutput,
        responseId: responseId
      }
    } catch (error) {
      console.error('Error in LlmService.answerMessage:', error)
      // Aqui você pode decidir se quer relançar o erro ou retornar null
      return null
    }
  }
}
