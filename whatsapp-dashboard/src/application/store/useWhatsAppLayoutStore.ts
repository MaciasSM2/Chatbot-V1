/**
 * @file useWhatsAppLayoutStore.ts
 * @description Estado global Zustand 5 para orquestar la interacción síncrona entre los 3 paneles.
 * Mantiene la continuidad estructural y de navegación fluida entre los módulos de Chats y Administración.
 */

import { create } from 'zustand';
import { UserRole } from '../config/navigationConfig';
import { useChatExecutionStore } from './useChatExecutionStore';

export type EngineType = 'FULL_JS' | 'HYBRID' | 'FULL_AI' | 'QUAD_SIMULTANEOUS';
export type FilterChip = 'ALL' | 'UNREAD' | 'FAVORITES';

export interface IChatSession {
  readonly id: string;
  readonly name: string;
  readonly avatar: string;
  readonly engineType: EngineType;
  readonly lastMessage: string;
  readonly timestamp: string;
  readonly isUnread: boolean;
  readonly isFavorite: boolean;
}

export interface ISubModuleItem {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly iconName: string;
}

interface IWhatsAppLayoutStore {
  activeModuleId: string;
  activeSubModuleId: string;
  activeChatId: string;
  activeFilter: FilterChip;
  chatSearchQuery: string;
  conversationSearchQuery: string;
  isConversationSearchOpen: boolean;
  isCustomizationMenuOpen: boolean;
  isCreateChatModalOpen: boolean;
  chatSessions: readonly IChatSession[];

  setActiveModule: (id: string) => void;
  setActiveSubModule: (id: string) => void;
  setActiveChat: (id: string) => void;
  setActiveFilter: (filter: FilterChip) => void;
  setChatSearchQuery: (query: string) => void;
  setConversationSearchQuery: (query: string) => void;
  toggleConversationSearch: () => void;
  toggleCustomizationMenu: () => void;
  setCreateChatModalOpen: (open: boolean) => void;
  createNewChatSession: (name: string, engineType: EngineType) => void;
  getFilteredSessionsForRole: (role: UserRole) => readonly IChatSession[];
}

const INITIAL_SESSIONS: readonly IChatSession[] = [
  {
    id: 'chat-quad-demo',
    name: 'Cuarto Chat — Quad Simultáneo',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
    engineType: 'QUAD_SIMULTANEOUS',
    lastMessage: 'Evaluación comparativa paralela de los 3 motores.',
    timestamp: '04:15 p. m.',
    isUnread: true,
    isFavorite: true,
  },
  {
    id: 'chat-js-demo',
    name: 'Atención Automatizada (Full JS)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    engineType: 'FULL_JS',
    lastMessage: 'Menú principal: Selecciona la opción 1 o 2.',
    timestamp: '02:55 p. m.',
    isUnread: false,
    isFavorite: false,
  },
  {
    id: 'chat-hybrid-demo',
    name: 'Soporte Logístico (Híbrido)',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    engineType: 'HYBRID',
    lastMessage: 'Consulta sobre fletes SICE-TAC derivada a IA.',
    timestamp: '01:27 p. m.',
    isUnread: true,
    isFavorite: true,
  },
  {
    id: 'chat-ai-demo',
    name: 'Asistente Virtual (Full IA)',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    engineType: 'FULL_AI',
    lastMessage: 'Conversación fluida continuada con RAG activo.',
    timestamp: '11:29 a. m.',
    isUnread: false,
    isFavorite: false,
  },
];

export const DEFAULT_SUBMODULES: Record<string, string> = {
  chats: 'chat-list',
  inicio: 'general-metrics',
  saludos: 'welcome-templates',
  clientes: 'crm-directory',
  calendario: 'exemptions',
  facturacion: 'invoices',
  configuraciones: 'general-settings',
};

export const useWhatsAppLayoutStore = create<IWhatsAppLayoutStore>((set, get) => ({
  activeModuleId: 'chats',
  activeSubModuleId: 'chat-list',
  activeChatId: 'chat-quad-demo',
  activeFilter: 'ALL',
  chatSearchQuery: '',
  conversationSearchQuery: '',
  isConversationSearchOpen: false,
  isCustomizationMenuOpen: false,
  isCreateChatModalOpen: false,
  chatSessions: INITIAL_SESSIONS,

  setActiveModule: (id) => {
    const defaultSub = DEFAULT_SUBMODULES[id] || 'general';
    set({ activeModuleId: id, activeSubModuleId: defaultSub });
  },

  setActiveSubModule: (id) => set({ activeSubModuleId: id }),
  setActiveChat: (id) => set({ activeChatId: id }),
  setActiveFilter: (filter) => set({ activeFilter: filter }),
  setChatSearchQuery: (query) => set({ chatSearchQuery: query }),
  setConversationSearchQuery: (query) => set({ conversationSearchQuery: query }),
  toggleConversationSearch: () => set((state) => ({ isConversationSearchOpen: !state.isConversationSearchOpen })),
  toggleCustomizationMenu: () => set((state) => ({ isCustomizationMenuOpen: !state.isCustomizationMenuOpen })),
  setCreateChatModalOpen: (open) => set({ isCreateChatModalOpen: open }),

  createNewChatSession: (name, engineType) => {
    const newId = `chat-${Date.now()}`;
    const newSession: IChatSession = {
      id: newId,
      name,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      engineType,
      lastMessage: 'Chat de prueba iniciado.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isUnread: false,
      isFavorite: false,
    };

    useChatExecutionStore.getState().registerSession(newId, name, engineType);

    set((state) => ({
      chatSessions: [newSession, ...state.chatSessions],
      activeChatId: newSession.id,
      isCreateChatModalOpen: false,
    }));
  },

  getFilteredSessionsForRole: (role) => {
    const { chatSessions, activeFilter, chatSearchQuery } = get();

    return chatSessions.filter((session) => {
      if (role !== 'DEVELOPER') {
        if (role === 'USER_FULL_JS' && session.engineType !== 'FULL_JS') return false;
        if (role === 'USER_HYBRID' && session.engineType !== 'HYBRID') return false;
        if (role === 'USER_FULL_AI' && session.engineType !== 'FULL_AI') return false;
      }

      if (activeFilter === 'UNREAD' && !session.isUnread) return false;
      if (activeFilter === 'FAVORITES' && !session.isFavorite) return false;

      if (chatSearchQuery.trim().length > 0) {
        return session.name.toLowerCase().includes(chatSearchQuery.toLowerCase());
      }

      return true;
    });
  },
}));
