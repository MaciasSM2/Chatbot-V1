import { create } from 'zustand';

export type BotType = 'JS' | 'HYBRID' | 'FULL_AI' | 'MULTI';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  sourceUsed?: 'FSM_JS' | 'AI_ENGINE';
  heuristicReason?: string;
}

export interface TokenMetrics {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  provider?: string;
  model?: string;
}

export interface ParsedRule {
  trigger_keyword: string;
  respuesta_texto: string;
  nodo_siguiente?: string;
  es_fallback?: boolean;
}

interface BotEngineStore {
  activeBotType: BotType;
  messages: Record<BotType, ChatMessage[]>;
  tokenMetrics: Record<BotType, TokenMetrics | null>;
  totalTokensSession: number;
  documentContext: string;
  parsedRules: ParsedRule[];
  aiProvider: 'gemini' | 'openai' | 'anthropic';
  apiKey: string;
  modoCaveman: boolean;
  heuristicThreshold: number;
  isLoading: boolean;

  setActiveBotType: (type: BotType) => void;
  setDocumentData: (text: string, rules: ParsedRule[]) => void;
  setAiConfig: (config: { provider?: 'gemini' | 'openai' | 'anthropic'; apiKey?: string; modoCaveman?: boolean; threshold?: number }) => void;
  sendMessage: (text: string) => Promise<void>;
  resetChat: (type?: BotType) => void;
}

export const useBotEngineStore = create<BotEngineStore>((set, get) => ({
  activeBotType: 'JS',
  messages: {
    JS: [
      {
        id: '1',
        sender: 'bot',
        text: '¡Hola! 👋 Bienvenido al Chat 1 (Full JS FSM). Todas las respuestas provienen de reglas predefinidas en base al documento cargado.',
        timestamp: '10:00',
        sourceUsed: 'FSM_JS'
      }
    ],
    HYBRID: [
      {
        id: '1',
        sender: 'bot',
        text: '¡Hola! 🤖⚡ Bienvenido al Chat 2 (Híbrido JS + IA). Respuestas simples por FSM JS; preguntas complejas o detalladas activan la IA automáticamente.',
        timestamp: '10:00',
        sourceUsed: 'FSM_JS'
      }
    ],
    FULL_AI: [
      {
        id: '1',
        sender: 'bot',
        text: '¡Hola! 🧠✨ Bienvenido al Chat 3 (Full IA). Potenciado por Inteligencia Artificial total con contexto de tu documento y contador de tokens en tiempo real.',
        timestamp: '10:00',
        sourceUsed: 'AI_ENGINE'
      }
    ],
    MULTI: []
  },
  tokenMetrics: {
    JS: null,
    HYBRID: null,
    FULL_AI: null,
    MULTI: null
  },
  totalTokensSession: 0,
  documentContext: '',
  parsedRules: [
    { trigger_keyword: 'hola', respuesta_texto: '¡Hola! ¿En qué puedo ayudarte hoy?' },
    { trigger_keyword: 'precios', respuesta_texto: 'Nuestros planes inician desde $29/mes para Chat JS, $59/mes Híbrido y $99/mes Full IA.' },
    { trigger_keyword: 'horario', respuesta_texto: 'Atendemos de lunes a viernes de 8:00 a.m. a 6:00 p.m.' }
  ],
  aiProvider: 'gemini',
  apiKey: '',
  modoCaveman: true,
  heuristicThreshold: 15,
  isLoading: false,

  setActiveBotType: (type: BotType) => set({ activeBotType: type }),

  setDocumentData: (text: string, rules: ParsedRule[]) =>
    set(state => ({
      documentContext: text,
      parsedRules: rules.length > 0 ? rules : state.parsedRules
    })),

  setAiConfig: (config) =>
    set(state => ({
      aiProvider: config.provider || state.aiProvider,
      apiKey: config.apiKey !== undefined ? config.apiKey : state.apiKey,
      modoCaveman: config.modoCaveman !== undefined ? config.modoCaveman : state.modoCaveman,
      heuristicThreshold: config.threshold || state.heuristicThreshold
    })),

  sendMessage: async (userMessageText: string) => {
    const { activeBotType, parsedRules, documentContext, aiProvider, apiKey, modoCaveman, heuristicThreshold } = get();

    if (!userMessageText.trim()) return;

    if (activeBotType === 'MULTI') {
      const targetTypes: ('JS' | 'HYBRID' | 'FULL_AI')[] = ['JS', 'HYBRID', 'FULL_AI'];
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        sender: 'user',
        text: userMessageText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      set(state => ({
        isLoading: true,
        messages: {
          ...state.messages,
          JS: [...state.messages.JS, userMsg],
          HYBRID: [...state.messages.HYBRID, userMsg],
          FULL_AI: [...state.messages.FULL_AI, userMsg]
        }
      }));

      await Promise.all(
        targetTypes.map(async (bType) => {
          const history = get().messages[bType].slice(0, -1).map(m => ({
            role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
            content: m.text
          }));

          try {
            const res = await fetch('/api/bots/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                botType: bType,
                userMessage: userMessageText,
                conversationHistory: history,
                rules: parsedRules,
                documentContext,
                aiConfig: {
                  proveedor: aiProvider,
                  apiKey,
                  umbralHeuristico: heuristicThreshold,
                  modoCaveman
                }
              })
            });

            const json = await res.json();
            const botData = json.data;

            const botMsg: ChatMessage = {
              id: (Date.now() + Math.random()).toString(),
              sender: 'bot',
              text: botData?.reply || 'Disculpa, no pude procesar la solicitud.',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              sourceUsed: botData?.sourceUsed,
              heuristicReason: botData?.heuristicReason
            };

            set(state => {
              const metrics = botData?.tokenMetrics || state.tokenMetrics[bType];
              const addedTokens = metrics?.totalTokens || 0;

              return {
                messages: {
                  ...state.messages,
                  [bType]: [...state.messages[bType], botMsg]
                },
                tokenMetrics: {
                  ...state.tokenMetrics,
                  [bType]: metrics
                },
                totalTokensSession: state.totalTokensSession + addedTokens
              };
            });
          } catch (err) {
            const fallbackMsg: ChatMessage = {
              id: (Date.now() + Math.random()).toString(),
              sender: 'bot',
              text: 'Error de comunicación con el backend.',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              sourceUsed: 'FSM_JS'
            };

            set(state => ({
              messages: {
                ...state.messages,
                [bType]: [...state.messages[bType], fallbackMsg]
              }
            }));
          }
        })
      );

      set({ isLoading: false });
      return;
    }

    // Capturar historial ANTES de agregar el mensaje del usuario
    const history = get().messages[activeBotType].map(m => ({
      role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
      content: m.text
    }));

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: userMessageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    set(state => ({
      isLoading: true,
      messages: {
        ...state.messages,
        [activeBotType]: [...state.messages[activeBotType], userMsg]
      }
    }));

    try {
      const res = await fetch('/api/bots/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botType: activeBotType,
          userMessage: userMessageText,
          conversationHistory: history,
          rules: parsedRules,
          documentContext,
          aiConfig: {
            proveedor: aiProvider,
            apiKey,
            umbralHeuristico: heuristicThreshold,
            modoCaveman
          }
        })
      });

      const json = await res.json();
      const botData = json.data;

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: botData?.reply || 'Disculpa, no pude procesar la solicitud.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sourceUsed: botData?.sourceUsed,
        heuristicReason: botData?.heuristicReason
      };

      set(state => {
        const metrics = botData?.tokenMetrics || state.tokenMetrics[activeBotType];
        const addedTokens = metrics?.totalTokens || 0;

        return {
          isLoading: false,
          messages: {
            ...state.messages,
            [activeBotType]: [...state.messages[activeBotType], botMsg]
          },
          tokenMetrics: {
            ...state.tokenMetrics,
            [activeBotType]: metrics
          },
          totalTokensSession: state.totalTokensSession + addedTokens
        };
      });
    } catch (err) {
      console.error('Error enviando mensaje al bot engine:', err);
      const fallbackMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: 'Error de comunicación con el backend.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sourceUsed: 'FSM_JS'
      };

      set(state => ({
        isLoading: false,
        messages: {
          ...state.messages,
          [activeBotType]: [...state.messages[activeBotType], fallbackMsg]
        }
      }));
    }
  },

  resetChat: (type) => {
    const target = type || get().activeBotType;
    set(state => ({
      messages: {
        ...state.messages,
        [target]: state.messages[target].slice(0, 1)
      }
    }));
  }
}));
