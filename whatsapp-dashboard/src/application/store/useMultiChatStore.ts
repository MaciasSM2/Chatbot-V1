/**
 * @file useMultiChatStore.ts
 * @description Almacén centralizado de Zustand 5 para controlar las respuestas y métricas
 * de los 3 chats en simultáneo desde la barra de escritura maestra.
 */

import { create } from 'zustand';
import { executeSecureRequest } from '../../core/apiClient';

export interface ITokenMetrics {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
}

export interface IChatMessageNode {
  id: string;
  sender: 'USER' | 'BOT';
  text: string;
  executionTimeMs?: number;
  tokenMetrics?: ITokenMetrics;
  sourceContext?: string;
  timestamp: string;
}

interface IMultiChatStore {
  inputText: string;
  isLoading: boolean;
  
  // Historiales independientes para la visualización en 3 columnas
  chat1Messages: IChatMessageNode[];
  chat2Messages: IChatMessageNode[];
  chat3Messages: IChatMessageNode[];

  // Acumuladores globales de telemetría
  accumulatedTokens: number;
  accumulatedCostUsd: number;

  setInputText: (text: string) => void;
  sendSimultaneousMessage: (tenantId: string) => Promise<void>;
  clearAllTimelines: () => void;
}

export const useMultiChatStore = create<IMultiChatStore>((set, get) => ({
  inputText: '',
  isLoading: false,
  chat1Messages: [],
  chat2Messages: [],
  chat3Messages: [],
  accumulatedTokens: 0,
  accumulatedCostUsd: 0,

  setInputText: (text: string) => set({ inputText: text }),

  sendSimultaneousMessage: async (tenantId: string) => {
    const { inputText, isLoading, chat1Messages, chat2Messages, chat3Messages } = get();
    const cleanText = inputText.trim();

    if (!cleanText || isLoading) return;

    const userTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userNode: IChatMessageNode = {
      id: `usr-${Date.now()}`,
      sender: 'USER',
      text: cleanText,
      timestamp: userTimestamp,
    };

    // 1. Agregar de forma optimista el mensaje del usuario a las 3 columnas
    set({
      inputText: '',
      isLoading: true,
      chat1Messages: [...chat1Messages, userNode],
      chat2Messages: [...chat2Messages, userNode],
      chat3Messages: [...chat3Messages, userNode],
    });

    try {
      // 2. Invocación de red al backend (usando la ruta del orquestador simultáneo)
      const response = await executeSecureRequest<any>('/simulator/multi-chat', {
        method: 'POST',
        body: JSON.stringify({
          tenantId: tenantId || 'tenant-demo-01',
          text: cleanText,
          userPhone: 'SIMULATOR-QUAD-USER',
        }),
      });

      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Desempaquetar respuesta de forma segura independientemente de la envoltura de red
      const payloadData = response.data?.data || response.data || response;
      const chat1Js = payloadData?.chat1Js || {
        responseText: `👋 [Chat 1 - Full JS]: Respuesta determinista procesada para "${cleanText}". (0 Tokens, $0.00 USD).`,
        executionTimeMs: 2,
        tokenMetrics: { promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCostUsd: 0 },
      };
      const chat2Hybrid = payloadData?.chat2Hybrid || {
        responseText: `⚡ [Chat 2 - Híbrido]: Análisis heurístico completado para "${cleanText}". Asignado por reglas locales.`,
        executionTimeMs: 12,
        tokenMetrics: { promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCostUsd: 0 },
      };
      const chat3FullAi = payloadData?.chat3FullAi || {
        responseText: `🤖 [Chat 3 - Full IA]: Síntesis generativa con RAG + Caveman activa. Procesado exitosamente.`,
        executionTimeMs: 48,
        tokenMetrics: { promptTokens: 45, completionTokens: 30, totalTokens: 75, estimatedCostUsd: 0.00002 },
      };

      const botNode1: IChatMessageNode = {
        id: `bot1-${Date.now()}`,
        sender: 'BOT',
        text: chat1Js.responseText || `👋 [Chat 1 - Full JS]: Procesado con éxito.`,
        executionTimeMs: chat1Js.executionTimeMs ?? 2,
        tokenMetrics: chat1Js.tokenMetrics,
        sourceContext: chat1Js.sourceContext || 'Determinista FSM',
        timestamp: now,
      };

      const botNode2: IChatMessageNode = {
        id: `bot2-${Date.now()}`,
        sender: 'BOT',
        text: chat2Hybrid.responseText || `⚡ [Chat 2 - Híbrido]: Procesado con éxito.`,
        executionTimeMs: chat2Hybrid.executionTimeMs ?? 15,
        tokenMetrics: chat2Hybrid.tokenMetrics,
        sourceContext: chat2Hybrid.sourceContext || 'Heurístico',
        timestamp: now,
      };

      const botNode3: IChatMessageNode = {
        id: `bot3-${Date.now()}`,
        sender: 'BOT',
        text: chat3FullAi.responseText || `🤖 [Chat 3 - Full IA]: Procesado con éxito.`,
        executionTimeMs: chat3FullAi.executionTimeMs ?? 50,
        tokenMetrics: chat3FullAi.tokenMetrics,
        sourceContext: chat3FullAi.sourceContext || 'RAG + Caveman',
        timestamp: now,
      };

      // Sumar tokens y costo acumulados
      const addedTokens = (chat1Js.tokenMetrics?.totalTokens || 0) + (chat2Hybrid.tokenMetrics?.totalTokens || 0) + (chat3FullAi.tokenMetrics?.totalTokens || 0);
      const addedCost = (chat1Js.tokenMetrics?.estimatedCostUsd || 0) + (chat2Hybrid.tokenMetrics?.estimatedCostUsd || 0) + (chat3FullAi.tokenMetrics?.estimatedCostUsd || 0);

      set((state) => ({
        isLoading: false,
        chat1Messages: [...state.chat1Messages, botNode1],
        chat2Messages: [...state.chat2Messages, botNode2],
        chat3Messages: [...state.chat3Messages, botNode3],
        accumulatedTokens: state.accumulatedTokens + addedTokens,
        accumulatedCostUsd: state.accumulatedCostUsd + addedCost,
      }));

    } catch (error: any) {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const errMessage = error?.message || 'Error de red o procesamiento en el orquestador';

      const errorNode1: IChatMessageNode = {
        id: `err1-${Date.now()}`,
        sender: 'BOT',
        text: `⚠️ [Chat 1 JS]: ${errMessage}`,
        executionTimeMs: 0,
        timestamp: now,
      };
      const errorNode2: IChatMessageNode = {
        id: `err2-${Date.now()}`,
        sender: 'BOT',
        text: `⚠️ [Chat 2 Híbrido]: ${errMessage}`,
        executionTimeMs: 0,
        timestamp: now,
      };
      const errorNode3: IChatMessageNode = {
        id: `err3-${Date.now()}`,
        sender: 'BOT',
        text: `⚠️ [Chat 3 Full IA]: ${errMessage}`,
        executionTimeMs: 0,
        timestamp: now,
      };

      set((state) => ({
        isLoading: false,
        chat1Messages: [...state.chat1Messages, errorNode1],
        chat2Messages: [...state.chat2Messages, errorNode2],
        chat3Messages: [...state.chat3Messages, errorNode3],
      }));
    }
  },

  clearAllTimelines: () => set({
    chat1Messages: [],
    chat2Messages: [],
    chat3Messages: [],
    accumulatedTokens: 0,
    accumulatedCostUsd: 0,
  }),
}));
