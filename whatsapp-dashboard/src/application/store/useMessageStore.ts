/**
 * @file useMessageStore.ts
 * @description Store de Zustand encargado de la manipulación e inyección optimista de mensajes.
 */
import { create } from 'zustand';
import { executeSecureRequest, getApiUrl } from '../../core/apiClient';

export interface IMessagePayload {
  id: string;
  sender: 'USER' | 'BOT' | 'SYSTEM';
  text: string;
  timestamp: string;
  status: 'SENT' | 'DELIVERED' | 'READ';
}

interface MessageState {
  messagesTimeline: IMessagePayload[];
  isSending: boolean;
  pushOptimisticMessage: (phone: string, text: string) => Promise<void>;
  appendIncomingMessage: (message: IMessagePayload) => void;
  clearChatTimeline: () => void;
}

export const useMessageStore = create<MessageState>((set) => ({
  messagesTimeline: [],
  isSending: false,

  pushOptimisticMessage: async (phone: string, text: string) => {
    set({ isSending: true });
    
    const optimisticMessage: IMessagePayload = {
      id: `MSG-OPT-${Date.now()}`,
      sender: 'USER',
      text: text.trim(),
      timestamp: new Date().toISOString(),
      status: 'SENT'
    };

    // Mutación reactiva optimista instantánea para fricción cero en UI
    set((state) => ({ messagesTimeline: [...state.messagesTimeline, optimisticMessage] }));

    try {
      await executeSecureRequest(`${getApiUrl()}/simulator/message`, {
        method: 'POST',
        body: JSON.stringify({ phone, text })
      });
    } catch (err) {
      console.error('X [MessageStore Error] Falló el despacho del payload:', err);
    } finally {
      set({ isSending: false });
    }
  },

  appendIncomingMessage: (message: IMessagePayload) => {
    set((state) => ({ messagesTimeline: [...state.messagesTimeline, message] }));
  },

  clearChatTimeline: () => set({ messagesTimeline: [] })
}));
