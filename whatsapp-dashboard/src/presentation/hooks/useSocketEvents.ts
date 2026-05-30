/**
 * @file useSocketEvents.ts
 * @description Orquestador de eventos Socket.io para el hilo de conversación.
 */

import { useEffect } from 'react';
import { io } from 'socket.io-client';

export const useSocketEvents = (chatId: string | null, onNewMessage: (msg: any) => void) => {
  useEffect(() => {
    if (!chatId) return;

    const socket = io(process.env.NEXT_PUBLIC_API_URL_BASE || "http://localhost:3000");
    
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
