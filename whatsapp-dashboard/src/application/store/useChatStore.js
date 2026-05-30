import { create } from 'zustand';
import { io } from 'socket.io-client';
import { WhatsAppChatRepository } from '../../infrastructure/repositories/WhatsAppChatRepository';
import { Message } from '../../core/entities/Message';

const API_URL = process.env.NEXT_PUBLIC_API_URL_BASE || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const chatRepository = new WhatsAppChatRepository(API_URL);

// Conexión lazy del socket fuera del store
let socket = null;

const getSocket = () => {
  if (!socket) {
    // Si la URL tiene el sufijo /api, se lo removemos para que Socket.io apunte al puerto raíz (Bug 3)
    const SOCKET_URL = API_URL.replace(/\/api$/, "");
    console.log(`[Socket] Conectando de forma Lazy a Socket.io en: ${SOCKET_URL}`);
    socket = io(SOCKET_URL);
  }
  return socket;
};

export const useChatStore = create((set, get) => ({
  messages: [],
  activeChats: [],
  isLoading: false,
  isLoadingActive: false,
  error: null,
  activeChatId: null,
  highlightedMessageId: null,
  activeScenario: null,
  isFullScreen: false,
  isConfiguring: false,

  setIsConfiguring: (val) => set({ isConfiguring: val }),
  toggleFullScreen: () => set((state) => ({ isFullScreen: !state.isFullScreen })),
  toggleChatPause: async (chatId) => {
    const { activeChats } = get();
    const chat = activeChats.find(c => c.userId === chatId);
    if (!chat) return;

    const newPauseState = !chat.isPaused;

    // 1. Optimistic Update on Frontend UI
    set({
      activeChats: activeChats.map(c => 
        c.userId === chatId ? { ...c, isPaused: newPauseState } : c
      )
    });

    try {
      // 2. Persist in Backend
      await chatRepository.toggleChatPause(chatId, newPauseState);
    } catch (error) {
      console.error("[useChatStore] Error al cambiar pausa:", error);
      // Fallback: Revert to original state on failure
      set({
        activeChats: activeChats.map(c => 
          c.userId === chatId ? { ...c, isPaused: !newPauseState } : c
        )
      });
    }
  },
  setActiveChat: (chatId) => set({ activeChatId: chatId }),
  setHighlightedMessageId: (id) => set({ highlightedMessageId: id }),

  // Carga todas las sesiones con chats activos
  loadActiveChats: async () => {
    set({ isLoadingActive: true });
    try {
      const chats = await chatRepository.getActiveChats();
      set({ activeChats: chats, isLoadingActive: false });
    } catch (error) {
      console.error("[useChatStore] Error al cargar chats activos:", error);
      set({ isLoadingActive: false });
    }
  },

  // Función para inicializar la escucha de sockets en tiempo real
  initSocket: (chatId) => {
    console.log(`[Socket] Inicializando oyente de sockets para canal: new_message_${chatId}`);
    const s = getSocket();

    // Unirse a la sala del chatId en el backend para aislamiento de mensajes (Bug 5)
    s.emit("join", chatId);

    // Escuchamos el evento específico para este usuario
    s.off(`new_message_${chatId}`); // Limpiamos oyentes previos
    s.on(`new_message_${chatId}`, (data) => {
      console.log(`[Socket] Mensaje recibido desde new_message_${chatId}:`, data);

      set((state) => {
        // 1. Evitar duplicar si ya existe el ID exacto
        if (state.messages.some((m) => m.id === data.id)) {
          return {};
        }

        // 2. Si es un mensaje del usuario, verificar si ya fue agregado localmente (mismo sender y text en los últimos 3 segundos)
        if (data.sender === 'user') {
          const threeSecondsAgo = Date.now() - 3000;
          const duplicateIndex = state.messages.findIndex((m) => 
            m.sender === 'user' && 
            m.text === data.text && 
            m.timestamp.getTime() >= threeSecondsAgo
          );

          if (duplicateIndex !== -1) {
            // Actualizar el ID y estado del mensaje existente en lugar de duplicarlo
            const updatedMessages = [...state.messages];
            const originalMsg = updatedMessages[duplicateIndex];
            
            // Recrear el mensaje con el ID real del servidor
            updatedMessages[duplicateIndex] = new Message({
              id: data.id,
              sender: originalMsg.sender,
              text: originalMsg.text,
              timestamp: originalMsg.timestamp,
              status: data.status || originalMsg.status
            });

            return {
              messages: updatedMessages,
              isLoading: true
            };
          }
        }

        const botMessage = new Message({
          id: data.id,
          sender: data.sender,
          text: data.text,
          timestamp: new Date(data.timestamp),
          status: data.status
        });

        return {
          messages: [...state.messages, botMessage],
          isLoading: data.sender === 'user' ? true : false
        };
      });

      // Recargar chats activos para actualizar el último mensaje en la barra lateral
      get().loadActiveChats();
    });

    // Escuchamos actualizaciones de estado del mensaje en tiempo real para el efecto visto
    s.off(`message_status_${chatId}`);
    s.on(`message_status_${chatId}`, (data) => {
      console.log(`[Socket] Estado de mensaje actualizado desde message_status_${chatId}:`, data);
      set((state) => ({
        messages: state.messages.map((m) => {
          if (m.id === data.messageId) {
            m.updateStatus(data.status);
            return new Message({
              id: m.id,
              sender: m.sender,
              text: m.text,
              timestamp: m.timestamp,
              status: m.status
            });
          }
          return m;
        })
      }));
    });
  },

  loadChatHistory: async (chatId) => {
    set({ isLoading: true, error: null });
    try {
      const messages = await chatRepository.getChatHistory(chatId);
      set({ messages, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  sendMessage: async (text) => {
    const { activeChatId, messages } = get();
    if (!activeChatId || !text.trim()) return;

    // Generar ID temporal para el mensaje optimista
    const tempId = `temp_${Date.now()}`;
    const optimisticMsg = new Message({
      id: tempId,
      sender: 'user',
      text,
      timestamp: new Date(),
      status: 'sending'
    });

    // Añadir mensaje optimista al estado local inmediatamente
    set({ messages: [...messages, optimisticMsg], isLoading: true });

    // Helper local para actualizar el estado del mensaje optimista en el store
    const updateLocalStatus = (newStatus, realId = null) => {
      set((state) => ({
        messages: state.messages.map((m) => {
          if (m.id === tempId) {
            return new Message({
              id: realId || m.id,
              sender: m.sender,
              text: m.text,
              timestamp: m.timestamp,
              status: newStatus
            });
          }
          return m;
        })
      }));
    };

    // Lanzar flujo asíncrono optimista
    (async () => {
      try {
        // --- 1. Simular Latencia de Salida al Servidor ---
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 400 + 300));
        updateLocalStatus('sent');

        // --- 2. Enviar mensaje real al backend de forma asíncrona ---
        const realMsg = await chatRepository.sendMessage(activeChatId, text);
        
        // --- 3. Simular Latencia de Entrega ---
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 500 + 400));
        updateLocalStatus('delivered', realMsg.id);

        // --- 4. El Bot "Lee" el mensaje ---
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 600 + 500));
        updateLocalStatus('read', realMsg.id);

        // Recargar chats activos para refrescar la lista lateral
        get().loadActiveChats();
      } catch (error) {
        console.error("[useChatStore] Error al enviar mensaje:", error);
        // Marcar enviado como fallback si falla el flujo asíncrono optimista
        updateLocalStatus('sent');
        set({ error: "Error de conexión", isLoading: false });
      }
    })();
  },


  resetChat: async (chatId) => {
    set({ isLoading: true });
    try {
      // Llamamos al backend para resetear la FSM y borrar historial
      await chatRepository.resetChat(chatId);
      
      // Limpiamos los mensajes en el estado local de la UI
      set({ messages: [], activeChatId: chatId, activeScenario: null });
      
      // Recargar chats activos para actualizar la barra lateral
      get().loadActiveChats();
    } catch (error) {
      console.error("[useChatStore] Error al resetear:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  searchMessages: async (query, startDate, endDate) => {
    if (!query || !query.trim()) return [];
    try {
      return await chatRepository.searchMessages(query, startDate, endDate);
    } catch (error) {
      console.error("[useChatStore] Error al buscar mensajes:", error);
      return [];
    }
  },

  startForcedConversation: async (chatId, config) => {
    set({ isLoading: true, error: null });
    try {
      // 1. Hard Reset: Limpiamos historial en BD, sesión Redis y logs locales
      await get().resetChat(chatId);

      // 2. Si se proporciona apiStatus, configurar escenario de error mock de Meta
      if (config.apiStatus) {
        const baseUrl = API_URL.endsWith('/api') ? API_URL.slice(0, -4) : API_URL;
        let scenario = 'SUCCESS';
        if (config.apiStatus === 'ERROR_500') scenario = 'SERVER_ERROR_500';
        else if (config.apiStatus === 'TIMEOUT') scenario = 'NETWORK_TIMEOUT';
        
        await fetch(`${baseUrl}/api/test/meta-scenario`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scenario })
        }).catch(err => console.error("Error setting meta-scenario:", err));
      }

      // 3. Pedimos el saludo específico al Backend con los parámetros exactos de simulación
      const baseUrl = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
      const response = await fetch(`${baseUrl}/test/greeting/${config.category}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: chatId,
          isNewClient: config.profile === 'NEW',
          dayType: config.dayType,
          timePeriod: config.timePeriod,
          gender: config.gender,
          initialState: config.initialState
        })
      });

      if (!response.ok) throw new Error("Error en la llamada de simulación.");
      const data = await response.json();

      // Guardamos la configuración activa en el store para el resumen del header
      set({ 
        activeScenario: {
          profile: config.profile,
          dayType: config.dayType,
          timePeriod: config.timePeriod,
          gender: config.gender,
          token: data.token,
          status: data.status,
          isNonWorkable: data.isNonWorkable,
          apiStatus: config.apiStatus
        }
      });

      // Recargamos historial de chat local para reflejar los mensajes del webhook/sistema inyectados en la simulación
      await get().loadChatHistory(chatId);
      
      // Recargar chats activos para actualizar la barra lateral
      await get().loadActiveChats();
    } catch (error) {
      console.error("[useChatStore] Error al iniciar conversación forzada:", error);
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  triggerStressTest: async () => {
    set({ isLoading: true });
    try {
      await chatRepository.triggerStressTest();
      // Recargar de inmediato y programar refrescos sucesivos
      setTimeout(async () => {
        await get().loadActiveChats();
      }, 1000);
      
      const refreshInterval = setInterval(async () => {
        await get().loadActiveChats();
      }, 2000);

      setTimeout(() => {
        clearInterval(refreshInterval);
      }, 16000);

    } catch (error) {
      console.error("[useChatStore] Error al iniciar stress test:", error);
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  triggerContinuity: async (chatId, minutes = 5) => {
    set({ isLoading: true });
    try {
      await chatRepository.triggerContinuity(chatId, minutes);
      // Recargar historial para ver el mensaje de continuidad al instante
      await get().loadChatHistory(chatId);
    } catch (error) {
      console.error("[useChatStore] Error al inyectar continuidad:", error);
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  }
}));

