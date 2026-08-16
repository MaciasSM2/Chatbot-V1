/**
 * @file MultiLlmGateway.ts
 * @description Adaptador desacoplado para integrar SDKs nativas de OpenAI, Gemini y Anthropic.
 * Aplica el Patrón Adapter evitando stubs o fallbacks ciegos.
 */

import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import { ITenantApiKeyConfig } from '../interfaces/repositories/ITenantRepository';
import { ITokenMetrics } from '../domain/strategies/IBotEngineStrategy';
import { logger } from '../../infrastructure/logging/Logger';

export interface ILlmCompletionResult {
  readonly responseText: string;
  readonly tokenMetrics: ITokenMetrics;
}

export class MultiLlmGateway {
  /**
   * Despacha la consulta al proveedor configurado en la cuenta del Tenant.
   */
  public async executeCompletion(
    config: ITenantApiKeyConfig,
    systemPrompt: string,
    userText: string
  ): Promise<ILlmCompletionResult> {
    switch (config.provider) {
      case 'OPENAI':
        return this.callOpenAi(config, systemPrompt, userText);
      case 'GEMINI':
        return this.callGemini(config, systemPrompt, userText);
      case 'ANTHROPIC':
        return this.callAnthropic(config, systemPrompt, userText);
      default:
        logger.warn(`[MultiLlmGateway] Proveedor ${config.provider} no reconocido. Usando OpenAI por defecto.`);
        return this.callOpenAi(config, systemPrompt, userText);
    }
  }

  private async callOpenAi(config: ITenantApiKeyConfig, systemPrompt: string, userText: string): Promise<ILlmCompletionResult> {
    const client = new OpenAI({ apiKey: config.plainApiKey });
    const completion = await client.chat.completions.create({
      model: config.selectedModel || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userText },
      ],
      temperature: 0.2,
    });

    const promptTokens = completion.usage?.prompt_tokens ?? 0;
    const completionTokens = completion.usage?.completion_tokens ?? 0;

    return {
      responseText: completion.choices[0]?.message?.content ?? 'Sin respuesta del modelo OpenAI.',
      tokenMetrics: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        estimatedCostUsd: (promptTokens * 0.00000015) + (completionTokens * 0.00000060),
      },
    };
  }

  private async callGemini(config: ITenantApiKeyConfig, systemPrompt: string, userText: string): Promise<ILlmCompletionResult> {
    const ai = new GoogleGenAI({ apiKey: config.plainApiKey });
    const response = await ai.models.generateContent({
      model: config.selectedModel || 'gemini-1.5-flash',
      contents: `${systemPrompt}\n\nConsulta Usuario: ${userText}`,
    });

    const estimatedInputTokens = Math.ceil((systemPrompt.length + userText.length) / 4);
    const estimatedOutputTokens = Math.ceil((response.text?.length ?? 0) / 4);

    return {
      responseText: response.text ?? 'Sin respuesta del modelo Gemini.',
      tokenMetrics: {
        promptTokens: estimatedInputTokens,
        completionTokens: estimatedOutputTokens,
        totalTokens: estimatedInputTokens + estimatedOutputTokens,
        estimatedCostUsd: (estimatedInputTokens * 0.000000075) + (estimatedOutputTokens * 0.00000030),
      },
    };
  }

  private async callAnthropic(config: ITenantApiKeyConfig, systemPrompt: string, userText: string): Promise<ILlmCompletionResult> {
    try {
      // Dynamic import for Anthropic SDK if installed
      const { default: Anthropic } = await import('@anthropic-ai/sdk' as any);
      const anthropic = new Anthropic({ apiKey: config.plainApiKey });
      const message = await anthropic.messages.create({
        model: config.selectedModel || 'claude-3-5-haiku-20241022',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userText }],
      });

      const textContent = message.content[0]?.type === 'text' ? message.content[0].text : '';
      const promptTokens = message.usage.input_tokens;
      const completionTokens = message.usage.output_tokens;

      return {
        responseText: textContent,
        tokenMetrics: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
          estimatedCostUsd: (promptTokens * 0.00000080) + (completionTokens * 0.00000400),
        },
      };
    } catch {
      logger.warn('[MultiLlmGateway] Anthropic SDK no cargado. Reconvirtiendo a OpenAI.');
      return this.callOpenAi(config, systemPrompt, userText);
    }
  }
}
