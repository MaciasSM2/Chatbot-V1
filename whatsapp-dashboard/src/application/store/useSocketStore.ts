import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { getApiUrl } from '../../core/apiClient';

interface SocketState {
  socket: Socket | null;
  establishLiveConnection: (operatorTokenId?: string) => Socket;
  terminateLiveConnection: () => void;
}

const SOCKET_URL = getApiUrl().replace(/\/api$/, '');

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,

  establishLiveConnection: (operatorTokenId?: string) => {
    const existing = get().socket;
    if (existing?.connected) return existing;

    const token = operatorTokenId
      || (typeof window !== 'undefined' ? localStorage.getItem('admin_session_token') : undefined);

    const socket: Socket = io(SOCKET_URL, {
      query: token ? { token } : undefined,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log('[SocketStore] Conexión establecida:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[SocketStore] Desconectado:', reason);
    });

    socket.on('connect_error', (err) => {
      console.error('[SocketStore] Error de conexión:', err.message);
    });

    set({ socket });
    return socket;
  },

  terminateLiveConnection: () => {
    const { socket } = get();
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      set({ socket: null });
    }
  },
}));
