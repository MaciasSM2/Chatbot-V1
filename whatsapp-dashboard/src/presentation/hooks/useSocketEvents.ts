/**
 * @file useSocketEvents.ts
 * @description Orquestador de eventos Socket.io para el hilo de conversación.
 */

import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { getApiUrl } from '../../core/apiClient';

export const useSocketEvents = (chatId: string | null, onNewMessage: (msg: any) => void) => {
  useEffect(() => {
    if (!chatId) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_session_token') : null;
    const socket = io(getApiUrl(), {
      query: token ? { token } : undefined
    });
    
    socket.emit("join", chatId);
    
    socket.on(`new_message_${chatId}`, (data) => {
      onNewMessage(data);
    });

    return () => {
      socket.off(`new_message_${chatId}`);
      socket.disconnect();
    };
  }, [chatId, onNewMessage]);
};
