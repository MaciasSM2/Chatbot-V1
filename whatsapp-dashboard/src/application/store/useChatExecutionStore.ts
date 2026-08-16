/**
 * @file useChatExecutionStore.ts
 * @description Estado global Zustand 5 para la gestión de mensajes conectados al Backend.
 * Controla el ruteo de peticiones para Chat 1 (JS), Chat 2 (Híbrido), Chat 3 (Full IA) y Quad-Chat.
 */

import { create } from 'zustand';
import { chatApiClient, IEngineResponseDTO } from '../../core/services/ChatApiClient';

export type EngineType = 'FULL_JS' | 'HYBRID' | 'FULL_AI' | 'QUAD_SIMULTANEOUS';

export interface IMessageNode {
  readonly id: string;
  readonly sender: 'USER' | 'BOT';
  readonly text: string;
  readonly timestamp: string;
  readonly executionTimeMs?: number;
  readonly totalTokens?: number;
  readonly costUsd?: number;
  readonly engineUsed?: string;
  readonly sourceContext?: string;
}

export interface IChatSessionState {
  readonly id: string;
  readonly name: string;
  readonly engineType: EngineType;
  readonly messages: readonly IMessageNode[];
}

interface IChatExecutionStore {
  sessions: Readonly<Record<string, IChatSessionState>>;
  isLoading: boolean;
  activeTenantId: string;
  accumulatedTokens: number;
  accumulatedCostUsd: number;

  sendMessage: (sessionId: string, text: string) => Promise<void>;
  registerSession: (sessionId: string, name: string, engineType: EngineType) => void;
  clearSessionMessages: (sessionId: string) => void;
}

const INITIAL_SESSIONS_MAP: Record<string, IChatSessionState> = {
  'chat-quad-demo': {
    id: 'chat-quad-demo',
    name: 'Cuarto Chat — Quad Simultáneo',
    engineType: 'QUAD_SIMULTANEOUS',
    messages: [],
  },
  'chat-js-demo': {
    id: 'chat-js-demo',
    name: 'Atención Automatizada (Full JS)',
    engineType: 'FULL_JS',
    messages: [
      {
        id: 'init-js',
        sender: 'BOT',
        text: '👋 ¡Hola! Bienvenido al asistente determinista (Chat 1 - Full JS). ¿En qué te colaboro?\n1. Información general\n2. Horarios de atención',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        executionTimeMs: 1,
        totalTokens: 0,
        costUsd: 0,
        engineUsed: 'FULL_JS',
      },
    ],
  },
  'chat-hybrid-demo': {
    id: 'chat-hybrid-demo',
    name: 'Soporte Logístico (Híbrido)',
    engineType: 'HYBRID',
    messages: [
      {
        id: 'init-hybrid',
        sender: 'BOT',
        text: '⚡ Hola. Soy el Chat Híbrido. Respondo por menú en JS y activo la IA si tu pregunta es compleja.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        executionTimeMs: 1,
        totalTokens: 0,
        costUsd: 0,
        engineUsed: 'HYBRID',
      },
    ],
  },
  'chat-ai-demo': {
    id: 'chat-ai-demo',
    name: 'Asistente Virtual (Full IA)',
    engineType: 'FULL_AI',
    messages: [
      {
        id: 'init-ai',
        sender: 'BOT',
        text: '🤖 Hola. Soy el motor Full IA con RAG y Caveman. Realiza cualquier consulta en lenguaje natural.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        executionTimeMs: 1,
        totalTokens: 0,
        costUsd: 0,
        engineUsed: 'FULL_AI',
      },
    ],
  },
};

export const useChatExecutionStore = create<IChatExecutionStore>((set, get) => ({
  sessions: INITIAL_SESSIONS_MAP,
  isLoading: false,
  activeTenantId: 'tenant-demo-01',
  accumulatedTokens: 0,
  accumulatedCostUsd: 0,

  registerSession: (sessionId: string, name: string, engineType: EngineType) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const welcomeText =
      engineType === 'FULL_JS'
        ? '👋 ¡Hola! Chat 1 (Full JS - Determinista) iniciado. Escribe una opción del menú.'
        : engineType === 'HYBRID'
        ? '⚡ ¡Hola! Chat 2 (Híbrido - JS + IA On-Demand) iniciado.'
        : engineType === 'FULL_AI'
        ? '🤖 ¡Hola! Chat 3 (Full IA Generativo) iniciado con RAG y Caveman.'
        : '🚀 Cuarto Chat (Quad Simultáneo) iniciado.';

    const newSessionState: IChatSessionState = {
      id: sessionId,
      name,
      engineType,
      messages: [
        {
          id: `init-${Date.now()}`,
          sender: 'BOT',
          text: welcomeText,
          timestamp: timeStr,
          executionTimeMs: 1,
          totalTokens: 0,
          costUsd: 0,
          engineUsed: engineType,
        },
      ],
    };

    set((state) => ({
      sessions: {
        ...state.sessions,
        [sessionId]: newSessionState,
      },
    }));
  },

  sendMessage: async (sessionId: string, text: string) => {
    const { sessions, activeTenantId, isLoading } = get();
    const cleanText = text.trim();

    if (!cleanText || isLoading) return;

    let targetSession = sessions[sessionId];
    if (!targetSession) {
      targetSession = {
        id: sessionId,
        name: 'Chat Activo',
        engineType: 'HYBRID',
        messages: [],
      };
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Inserción optimista del mensaje del usuario
    const userNode: IMessageNode = {
      id: `usr-${Date.now()}`,
      sender: 'USER',
      text: cleanText,
      timestamp: timeStr,
    };

    set((state) => ({
      isLoading: true,
      sessions: {
        ...state.sessions,
        [sessionId]: {
          ...targetSession,
          messages: [...targetSession.messages, userNode],
        },
      },
    }));

    // 2. Invocación al Backend mediante ChatApiClient
    const apiResult = await chatApiClient.executeChatRequest(activeTenantId, cleanText, sessionId);

    if (apiResult.success && apiResult.data) {
      const { chat1Js, chat2Hybrid, chat3FullAi } = apiResult.data;

      let selectedResponse: IEngineResponseDTO;

      // Asignación estricta de la respuesta según el motor del chat activo
      switch (targetSession.engineType) {
        case 'FULL_JS':
          selectedResponse = chat1Js;
          break;
        case 'HYBRID':
          selectedResponse = chat2Hybrid;
          break;
        case 'FULL_AI':
          selectedResponse = chat3FullAi;
          break;
        default:
          selectedResponse = chat2Hybrid;
      }

      const botNode: IMessageNode = {
        id: `bot-${Date.now()}`,
        sender: 'BOT',
        text: selectedResponse.responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        executionTimeMs: selectedResponse.executionTimeMs,
        totalTokens: selectedResponse.tokenMetrics?.totalTokens ?? 0,
        costUsd: selectedResponse.tokenMetrics?.estimatedCostUsd ?? 0,
        engineUsed: selectedResponse.chatType,
        sourceContext: selectedResponse.sourceContext,
      };

      const tokensAdded = selectedResponse.tokenMetrics?.totalTokens ?? 0;
      const costAdded = selectedResponse.tokenMetrics?.estimatedCostUsd ?? 0;

      set((state) => ({
        isLoading: false,
        accumulatedTokens: state.accumulatedTokens + tokensAdded,
        accumulatedCostUsd: state.accumulatedCostUsd + costAdded,
        sessions: {
          ...state.sessions,
          [sessionId]: {
            ...state.sessions[sessionId]!,
            messages: [...state.sessions[sessionId]!.messages, botNode],
          },
        },
      }));
    } else {
      // Manejo de degradación en caso de error de red
      const errorNode: IMessageNode = {
        id: `err-${Date.now()}`,
        sender: 'BOT',
        text: `⚠️ [Error de Conexión]: No pudimos conectar con el servidor backend (${apiResult.error || 'Error indeterminado'}).`,
        timestamp: timeStr,
        executionTimeMs: 0,
        totalTokens: 0,
        costUsd: 0,
      };

      set((state) => ({
        isLoading: false,
        sessions: {
          ...state.sessions,
          [sessionId]: {
            ...state.sessions[sessionId]!,
            messages: [...state.sessions[sessionId]!.messages, errorNode],
          },
        },
      }));
    }
  },

  clearSessionMessages: (sessionId: string) => {
    set((state) => {
      const session = state.sessions[sessionId];
      if (!session) return state;

      return {
        sessions: {
          ...state.sessions,
          [sessionId]: {
            ...session,
            messages: [],
          },
        },
      };
    });
  },
}));
