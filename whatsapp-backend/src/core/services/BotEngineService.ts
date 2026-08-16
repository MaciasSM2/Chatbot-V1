import { ParsedRule } from './DocumentParserService';
import { HeuristicEngineService } from './HeuristicEngineService';
import { AiProviderGateway } from '../../infrastructure/gateways/AiProviderGateway';

export type BotType = 'JS' | 'HYBRID' | 'FULL_AI';

export interface ProcessMessageRequest {
  botType: BotType;
  userMessage: string;
  conversationHistory: { role: 'user' | 'assistant'; content: string }[];
  rules?: ParsedRule[];
  documentContext?: string;
  aiConfig?: {
    proveedor?: 'gemini' | 'openai' | 'anthropic';
    apiKey?: string;
    modelo?: string;
    promptSistema?: string;
    umbralHeuristico?: number;
    modoCaveman?: boolean;
  };
}

export interface ProcessMessageResponse {
  reply: string;
  sourceUsed: 'FSM_JS' | 'AI_ENGINE';
  heuristicReason?: string;
  tokenMetrics?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    provider: string;
    model: string;
  };
}

export class BotEngineService {
  private heuristicEngine = new HeuristicEngineService();
  private aiGateway = new AiProviderGateway();

  public async processMessage(req: ProcessMessageRequest): Promise<ProcessMessageResponse> {
    const rules = req.rules || [];

    if (req.botType === 'JS') {
      return this.processFullJs(req.userMessage, rules);
    } else if (req.botType === 'HYBRID') {
      return this.processHybrid(req, rules);
    } else {
      return this.processFullAi(req);
    }
  }

  private processFullJs(userMessage: string, rules: ParsedRule[]): ProcessMessageResponse {
    const cleanMsg = userMessage.toLowerCase().trim();
    const match = rules.find(r => cleanMsg.includes(r.trigger_keyword));

    if (match) {
      return {
        reply: match.respuesta_texto,
        sourceUsed: 'FSM_JS',
        heuristicReason: `Coincidencia exacta FSM en regla "${match.trigger_keyword}"`
      };
    }

    const fallbackRule = rules.find(r => r.es_fallback) || rules[0];
    const defaultReply = fallbackRule
      ? fallbackRule.respuesta_texto
      : 'Gracias por tu mensaje. Para ayudarte mejor, escoge una de las opciones del menú o consulta sobre nuestros servicios principales.';

    return {
      reply: defaultReply,
      sourceUsed: 'FSM_JS',
      heuristicReason: 'Respuesta por defecto FSM JS (Sin coincidencia estricta)'
    };
  }

  private async processHybrid(req: ProcessMessageRequest, rules: ParsedRule[]): Promise<ProcessMessageResponse> {
    const umbral = req.aiConfig?.umbralHeuristico || 15;
    const evalResult = this.heuristicEngine.evaluate(req.userMessage, rules, umbral);

    if (!evalResult.shouldTriggerAI && evalResult.matchedRule) {
      return {
        reply: evalResult.matchedRule.respuesta_texto,
        sourceUsed: 'FSM_JS',
        heuristicReason: evalResult.reason
      };
    }

    // Dispara a IA
    const aiRes = await this.aiGateway.generateResponse({
      provider: req.aiConfig?.proveedor || 'gemini',
      apiKey: req.aiConfig?.apiKey || undefined,
      model: req.aiConfig?.modelo || undefined,
      systemPrompt: req.aiConfig?.promptSistema || 'Eres un asistente híbrido de soporte.',
      documentContext: req.documentContext || undefined,
      conversationHistory: req.conversationHistory,
      userMessage: req.userMessage,
      modoCaveman: req.aiConfig?.modoCaveman ?? true
    });

    return {
      reply: aiRes.reply,
      sourceUsed: 'AI_ENGINE',
      heuristicReason: evalResult.reason,
      tokenMetrics: {
        promptTokens: aiRes.promptTokens,
        completionTokens: aiRes.completionTokens,
        totalTokens: aiRes.totalTokens,
        provider: aiRes.providerUsed,
        model: aiRes.modelUsed
      }
    };
  }

  private async processFullAi(req: ProcessMessageRequest): Promise<ProcessMessageResponse> {
    const aiRes = await this.aiGateway.generateResponse({
      provider: req.aiConfig?.proveedor || 'gemini',
      apiKey: req.aiConfig?.apiKey || undefined,
      model: req.aiConfig?.modelo || undefined,
      systemPrompt: req.aiConfig?.promptSistema || 'Eres un asistente experto optimizado con inteligencia artificial completa.',
      documentContext: req.documentContext || undefined,
      conversationHistory: req.conversationHistory,
      userMessage: req.userMessage,
      modoCaveman: req.aiConfig?.modoCaveman ?? true
    });

    return {
      reply: aiRes.reply,
      sourceUsed: 'AI_ENGINE',
      heuristicReason: 'Full IA activado directamente',
      tokenMetrics: {
        promptTokens: aiRes.promptTokens,
        completionTokens: aiRes.completionTokens,
        totalTokens: aiRes.totalTokens,
        provider: aiRes.providerUsed,
        model: aiRes.modelUsed
      }
    };
  }
}
