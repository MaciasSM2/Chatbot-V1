import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

export interface AiChatRequest {
  provider: 'gemini' | 'openai' | 'anthropic';
  apiKey?: string | undefined;
  model?: string | undefined;
  systemPrompt: string;
  documentContext?: string | undefined;
  conversationHistory: { role: 'user' | 'assistant'; content: string }[];
  userMessage: string;
  modoCaveman?: boolean | undefined;
}


export interface AiChatResponse {
  reply: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  providerUsed: string;
  modelUsed: string;
}

export class AiProviderGateway {
  /**
   * Genera respuesta de IA integrando contexto de documento, compresión de tokens y contador.
   */
  public async generateResponse(req: AiChatRequest): Promise<AiChatResponse> {
    const provider = req.provider || 'gemini';

    if (provider === 'openai') {
      return this.callOpenAI(req);
    } else if (provider === 'anthropic') {
      return this.callAnthropic(req);
    } else {
      return this.callGemini(req);
    }
  }

  private buildFullSystemPrompt(req: AiChatRequest): string {
    let prompt = req.systemPrompt || 'Eres un asistente virtual servicial y preciso.';

    if (req.documentContext) {
      prompt += `\n\n[CONTEXTO BASE DEL DOCUMENTO]\n${req.documentContext}\n[FIN CONTEXTO]`;
    }

    const isCavemanActive = req.modoCaveman ?? true;
    if (isCavemanActive) {
      prompt += `\n\n[REGLA DE CONTEXTO CAVEMAN]: Responde de forma ultra concisa, directa y sin relleno. Conserva términos técnicos pero elimina artículos, saludos y amabilidades innecesarias para minimizar consumo de tokens.`;
    }

    return prompt;
  }

  private estimateTokens(text: string): number {
    if (!text) return 0;
    // Estimación aproximada: ~4 caracteres por token en español
    return Math.ceil(text.length / 3.8);
  }

  private async callGemini(req: AiChatRequest): Promise<AiChatResponse> {
    const apiKey = req.apiKey || process.env.GEMINI_API_KEY || '';
    const modelName = req.model || 'gemini-1.5-flash';

    if (!apiKey) {
      // Fallback simulado o error claro
      const fallbackReply = req.modoCaveman
        ? 'API Key Gemini no configurada. Configurar en backend.'
        : 'Disculpas, la clave de API de Gemini no está configurada en la aplicación.';
      return {
        reply: fallbackReply,
        promptTokens: 10,
        completionTokens: 15,
        totalTokens: 25,
        providerUsed: 'gemini (mock)',
        modelUsed: modelName
      };
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const systemPrompt = this.buildFullSystemPrompt(req);

      const contents = req.conversationHistory.map(h => `${h.role === 'user' ? 'Usuario' : 'Asistente'}: ${h.content}`).join('\n');
      const fullPrompt = `${systemPrompt}\n\nHistorial:\n${contents}\nUsuario: ${req.userMessage}\nAsistente:`;

      const response = await ai.models.generateContent({
        model: modelName,
        contents: fullPrompt
      });

      const replyText = response.text || 'Sin respuesta.';
      const pTokens = this.estimateTokens(fullPrompt);
      const cTokens = this.estimateTokens(replyText);

      return {
        reply: replyText,
        promptTokens: pTokens,
        completionTokens: cTokens,
        totalTokens: pTokens + cTokens,
        providerUsed: 'gemini',
        modelUsed: modelName
      };
    } catch (err: any) {
      console.error('Error Gemini Gateway:', err);
      return {
        reply: `Error consultando Gemini: ${err.message || err}`,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        providerUsed: 'gemini',
        modelUsed: modelName
      };
    }
  }

  private async callOpenAI(req: AiChatRequest): Promise<AiChatResponse> {
    const apiKey = req.apiKey || process.env.OPENAI_API_KEY || '';
    const modelName = req.model || 'gpt-4o-mini';

    if (!apiKey) {
      return {
        reply: req.modoCaveman ? 'OpenAI API key no configurada.' : 'Error: API Key de OpenAI requerida.',
        promptTokens: 5,
        completionTokens: 5,
        totalTokens: 10,
        providerUsed: 'openai (mock)',
        modelUsed: modelName
      };
    }

    try {
      const client = new OpenAI({ apiKey });
      const systemPrompt = this.buildFullSystemPrompt(req);

      const messages: OpenAI.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...req.conversationHistory.map(h => ({
          role: h.role === 'user' ? ('user' as const) : ('assistant' as const),
          content: h.content
        })),
        { role: 'user', content: req.userMessage }
      ];

      const completion = await client.chat.completions.create({
        model: modelName,
        messages
      });

      const replyText = completion.choices[0]?.message?.content || 'Sin respuesta';
      const promptTokens = completion.usage?.prompt_tokens || this.estimateTokens(systemPrompt + req.userMessage);
      const completionTokens = completion.usage?.completion_tokens || this.estimateTokens(replyText);

      return {
        reply: replyText,
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        providerUsed: 'openai',
        modelUsed: modelName
      };
    } catch (err: any) {
      console.error('Error OpenAI Gateway:', err);
      return {
        reply: `Error OpenAI: ${err.message || err}`,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        providerUsed: 'openai',
        modelUsed: modelName
      };
    }
  }

  private async callAnthropic(req: AiChatRequest): Promise<AiChatResponse> {
    const apiKey = req.apiKey || process.env.ANTHROPIC_API_KEY || '';
    const modelName = req.model || 'claude-3-5-sonnet-20241022';

    if (!apiKey) {
      return {
        reply: req.modoCaveman ? 'Anthropic API key no configurada.' : 'Error: API Key de Anthropic requerida.',
        promptTokens: 5,
        completionTokens: 5,
        totalTokens: 10,
        providerUsed: 'anthropic (mock)',
        modelUsed: modelName
      };
    }

    try {
      const systemPrompt = this.buildFullSystemPrompt(req);
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: modelName,
          max_tokens: 1024,
          system: systemPrompt,
          messages: [
            ...req.conversationHistory.map(h => ({ role: h.role, content: h.content })),
            { role: 'user', content: req.userMessage }
          ]
        })
      });

      const data = (await res.json()) as any;
      const replyText = data.content?.[0]?.text || 'Sin respuesta';
      const promptTokens = data.usage?.input_tokens || this.estimateTokens(systemPrompt + req.userMessage);
      const completionTokens = data.usage?.output_tokens || this.estimateTokens(replyText);

      return {
        reply: replyText,
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        providerUsed: 'anthropic',
        modelUsed: modelName
      };
    } catch (err: any) {
      return {
        reply: `Error Anthropic: ${err.message || err}`,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        providerUsed: 'anthropic',
        modelUsed: modelName
      };
    }
  }
}
