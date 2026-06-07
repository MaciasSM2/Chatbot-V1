import { create } from 'zustand';
import { executeSecureRequest } from '../../core/apiClient';

export interface IUiMessage {
  id: string;
  sender: 'CLIENT' | 'BOT' | 'AGENT';
  text: string;
  timestamp: string;
}

interface IChatStore {
  activeChatPhone: string | null;
  messagesTimeline: IUiMessage[];
  isSendingPayload: boolean;
  setActiveChatPhone: (phone: string) => void;
  sendSimulatedMessage: (userText: string) => Promise<void>;
  clearLocalHistory: () => void;

  messages: IUiMessage[];
  activeChats: Array<{ id: string; phone: string; name: string; userId: string; clientName: string; isRegistered: boolean; isPaused: boolean; metadata: any; currentStep: string }>;
  highlightedMessageId: string | null;
  setHighlightedMessageId: (id: string | null) => void;
  isFullScreen: boolean;
  isConfiguring: boolean;
  isLoadingActive: boolean;
  isLoading: boolean;
  activeScenario: { isNonWorkable: boolean; dayType: string } | null;
  quickActions: string[];
  activeContinuityTimers: number;

  activeChatId: string | null;
  setActiveChat: (phone: string | null) => void;
  loadChatHistory: (phone: string) => Promise<void>;
  initSocket: (chatId: string) => void;
  triggerStressTest: () => void;
  startForcedConversation: (phone: string, config?: any) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  loadActiveChats: () => Promise<void>;
  resetChat: (chatId?: string) => void;
  searchMessages: (query: string) => void;
  toggleFullScreen: () => void;
  setIsConfiguring: (state: boolean | ((prev: boolean) => boolean)) => void;
  toggleChatPause: (chatId: string) => Promise<void>;
}

const MAX_STORAGE_MESSAGES = 50;

export const useChatStore = create<IChatStore>((set, get) => ({
  activeChatPhone: null,
  messagesTimeline: [],
  isSendingPayload: false,

  messages: [],
  activeChats: [
    { id: '1', phone: '573149999999', name: 'Simulador Asesor Principal', userId: '573149999999', clientName: 'Simulador Asesor Principal', isRegistered: false, isPaused: false, metadata: { fullName: 'Simulador' }, currentStep: 'WELCOME' },
    { id: '2', phone: '573000000000', name: 'Canal de Pruebas SICE-TAC', userId: '573000000000', clientName: 'Canal de Pruebas SICE-TAC', isRegistered: false, isPaused: false, metadata: { fullName: 'Pruebas SICE-TAC' }, currentStep: 'WELCOME' }
  ],
  highlightedMessageId: null,
  setHighlightedMessageId: (id: string | null) => set({ highlightedMessageId: id }),
  isFullScreen: false,
  isConfiguring: false,
  isLoadingActive: false,
  isLoading: false,
  activeScenario: { isNonWorkable: false, dayType: 'WEEKDAY' },
  quickActions: ['Cotizar Flete', 'Solicitar Humano', 'Reiniciar Bot'],
  activeContinuityTimers: 0,
  activeChatId: null,

  setActiveChat: (phone: string | null) => {
    if (phone) get().setActiveChatPhone(phone);
  },

  setActiveChatPhone: (phone: string) => {
    if (typeof window === 'undefined') return;
    const cachedDbRaw = localStorage.getItem(`sim_db:${phone}`);
    const hydratedMessages: IUiMessage[] = cachedDbRaw ? JSON.parse(cachedDbRaw) : [];

    set({ activeChatPhone: phone, activeChatId: phone, messagesTimeline: hydratedMessages, messages: hydratedMessages });
  },

  sendSimulatedMessage: async (userText: string) => {
    const currentPhone = get().activeChatPhone;
    if (!currentPhone || !userText.trim()) return;

    const userNode: IUiMessage = {
      id: `MSG-USER-${Date.now()}`,
      sender: 'CLIENT',
      text: userText.trim(),
      timestamp: new Date().toISOString()
    };

    const updatedWithUser = [...get().messagesTimeline, userNode];
    set({ messagesTimeline: updatedWithUser, messages: updatedWithUser, isSendingPayload: true });

    const networkResult = await executeSecureRequest('/simulator/scenario', {
      method: 'POST',
      body: JSON.stringify({
        phone: currentPhone,
        text: userText.trim()
      })
    });

    let finalTimeline = [...updatedWithUser];

    if (networkResult.success && networkResult.data?.responseMessage !== 'CONTROL_HUMANO_ACTIVO') {
      const botResponseNode: IUiMessage = {
        id: `MSG-BOT-${Date.now()}`,
        sender: 'BOT',
        text: networkResult.data.responseMessage,
        timestamp: networkResult.data.timestamp || new Date().toISOString()
      };
      finalTimeline.push(botResponseNode);
    } else if (!networkResult.success) {
      finalTimeline.push({
        id: `MSG-ERR-${Date.now()}`,
        sender: 'BOT',
        text: `Error del Servidor: ${networkResult.error}`,
        timestamp: new Date().toISOString()
      });
    }

    if (finalTimeline.length > MAX_STORAGE_MESSAGES) {
      finalTimeline = finalTimeline.slice(finalTimeline.length - MAX_STORAGE_MESSAGES);
    }

    localStorage.setItem(`sim_db:${currentPhone}`, JSON.stringify(finalTimeline));
    set({ messagesTimeline: finalTimeline, messages: finalTimeline, isSendingPayload: false });
  },

  clearLocalHistory: () => {
    const currentPhone = get().activeChatPhone;
    if (currentPhone) {
      localStorage.removeItem(`sim_db:${currentPhone}`);
      set({ messagesTimeline: [], messages: [] });
    }
  },

  loadChatHistory: async (phone: string) => {
    const currentPhone = get().activeChatPhone;
    if (phone !== currentPhone) {
      get().setActiveChatPhone(phone);
    }
  },
  initSocket: (_chatId: string) => { /* no-op — socket handled by useSocketStore */ },
  triggerStressTest: () => { /* no-op */ },
  startForcedConversation: async (_phone: string, _config?: any) => { /* no-op */ },
  sendMessage: async (text: string) => {
    await get().sendSimulatedMessage(text);
  },
  loadActiveChats: async () => { /* no-op */ },
  resetChat: (_chatId?: string) => get().clearLocalHistory(),
  searchMessages: (query: string) => { console.log(`Buscando localmente: ${query}`); },
  toggleFullScreen: () => set((state) => ({ isFullScreen: !state.isFullScreen })),
  setIsConfiguring: (state: boolean | ((prev: boolean) => boolean)) => {
    if (typeof state === 'function') {
      set((prev) => ({ isConfiguring: (state as (prev: boolean) => boolean)(prev.isConfiguring) }));
    } else {
      set({ isConfiguring: state });
    }
  },
  toggleChatPause: async (_chatId: string) => {
    await executeSecureRequest('/admin/chat/toggle-pause', { method: 'POST' });
  }
}));
