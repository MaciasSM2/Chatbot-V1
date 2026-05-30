/**
 * @file useSocketEvents.js
 * @description Hook puente para escuchar eventos del socket en componentes de UI.
 */

import { useEffect, useRef } from 'react';
import { useChatStore } from '../store/useChatStore';

export const useSocketEvents = (chatId, callback) => {
  const { messages } = useChatStore();
  const prevMessagesLength = useRef(messages.length);

  useEffect(() => {
    // Detectamos si hay nuevos mensajes
    if (messages.length > prevMessagesLength.current) {
      const newMessages = messages.slice(prevMessagesLength.current);
      newMessages.forEach(msg => {
        // Ejecutamos el callback por cada mensaje nuevo
        callback(msg);
      });
    }
    prevMessagesLength.current = messages.length;
  }, [messages, callback]);
};
