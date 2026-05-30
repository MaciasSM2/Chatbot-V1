/**
 * @file ContextResolver.ts
 * @description Analiza el historial para dar respuestas más inteligentes.
 */

import { ChatSession } from "../entities/ChatSession";

export const resolveContext = (session: ChatSession, newMessage: string) => {
  const history = session.history;
  const lastBotMessage = history.filter(m => m.sender === 'bot').pop();

  // Ejemplo: Si el bot preguntó el nombre y el usuario responde solo una palabra
  if (session.currentStep === 'AWAITING_NAME' && lastBotMessage) {
    if (lastBotMessage.text.toLowerCase().includes("indicarme tu nombre") || 
        lastBotMessage.text.toLowerCase().includes("nombre completo")) {
      return { action: 'REGISTER_NAME', value: newMessage };
    }
  }

  // Ejemplo: Detección de "Gracias" para cerrar flujos
  if (newMessage.toLowerCase().includes("gracias")) {
    return { action: 'END_CONVERSATION', value: null };
  }

  return { action: 'CONTINUE_FSM', value: newMessage };
};
