import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface SocketState {
  socket: Socket | null;
  establishLiveConnection: () => Socket;
  terminateLiveConnection: () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,

  establishLiveConnection: () => {
    const existing = get().socket;
    if (existing?.connected) return existing;

    const socketUrl = typeof window !== 'undefined'
      ? window.location.origin
      : 'http://whatsapp-backend:3000';

    const socket: Socket = io(socketUrl, {
      path: '/socket.io/',
      transports: ['websocket'],
      autoConnect: true,
      reconnectionAttempts: 5
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
