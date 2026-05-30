import { Message } from '../../core/entities/Message';
import { IChatRepository } from '../../core/interfaces/IChatRepository';

export class WhatsAppChatRepository extends IChatRepository {
  _baseUrl;

  constructor(baseUrl) {
    super();
    // Normalizar la URL base para asegurar que termine con /api de forma resiliente
    this._baseUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
  }

  async getChatHistory(chatId) {
    try {
      console.log(`[WhatsAppChatRepository] Obteniendo historial para ${chatId}`);
      const apiPath = `${this._baseUrl}/messages/${chatId}`;
      
      const response = await fetch(apiPath);
      if (!response.ok) throw new Error("Error al obtener el historial de chat real");
      
      const data = await response.json();
      return data.map(msg => new Message({
        id: msg.id,
        sender: msg.sender,
        text: msg.text,
        timestamp: new Date(msg.timestamp),
        status: msg.status
      }));
    } catch (error) {
      console.error(`[WhatsAppChatRepository] Error en getChatHistory:`, error);
      throw error;
    }
  }

  async getActiveChats() {
    try {
      console.log(`[WhatsAppChatRepository] Obteniendo chats activos`);
      const apiPath = `${this._baseUrl}/chats`;

      const response = await fetch(apiPath);
      if (!response.ok) throw new Error("Error al obtener los chats activos");

      return await response.json();
    } catch (error) {
      console.error(`[WhatsAppChatRepository] Error en getActiveChats:`, error);
      throw error;
    }
  }

  /**
   * Envía el mensaje al Webhook real del Backend
   */
  async sendMessage(chatId, text, customResponse = null) {
    try {
      console.log(`[WhatsAppChatRepository] Enviando mensaje real a ${chatId}: ${text}`);
      const response = await fetch(`${this._baseUrl}/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: chatId,      // El ID que usa el simulador
          messageBody: text,   // El texto del input
          messageId: `sim_${Date.now()}`, // ID único para evitar duplicados en Redis
          customResponse: customResponse
        })
      });

      if (!response.ok) throw new Error("Error al conectar con el servidor del ChatBot");

      // Retornamos el mensaje del usuario para la UI
      return new Message({
        id: `msg_${Date.now()}`,
        sender: 'user',
        text: text,
        timestamp: new Date(),
        status: 'sent'
      });
    } catch (error) {
      console.error("Error en comunicación:", error);
      throw error;
    }
  }

  async fetchGreetingByCategory(category) {
    try {
      console.log(`[WhatsAppChatRepository] Obteniendo saludos por categoría ${category}`);
      const apiPath = `${this._baseUrl}/greetings?category=${category}`;
      
      const response = await fetch(apiPath);
      if (!response.ok) throw new Error("Error al obtener los saludos por categoría");
      
      const data = await response.json();
      if (!data || data.length === 0) {
        throw new Error("No hay saludos configurados para esta categoría");
      }
      // Retornar un saludo aleatorio de los encontrados
      const randomIndex = Math.floor(Math.random() * data.length);
      return data[randomIndex];
    } catch (error) {
      console.error(`[WhatsAppChatRepository] Error en fetchGreetingByCategory:`, error);
      // Fallback robusto por defecto
      if (category === 'CONTINUITY') {
        return {
          id: 'fallback-continuity',
          text: '¿Sigues ahí? Si tienes alguna duda, por favor házmelo saber para poder ayudarte.',
          dayType: 'WEEKDAY',
          timePeriod: 'MORNING',
          category: 'CONTINUITY'
        };
      }
      return {
        id: 'fallback-response',
        text: '¡Hola! ¿En qué puedo ayudarte hoy?',
        dayType: 'WEEKDAY',
        timePeriod: 'MORNING',
        category: 'RESPONSE'
      };
    }
  }

  async resetChat(chatId) {
    try {
      console.log(`[WhatsAppChatRepository] Reseteando chat para ${chatId}`);
      const apiPath = `${this._baseUrl}/messages/${chatId}`;
      
      const response = await fetch(apiPath, { method: 'DELETE' });
      if (!response.ok) throw new Error("Error al resetear el chat");
      
      return await response.json();
    } catch (error) {
      console.error(`[WhatsAppChatRepository] Error en resetChat:`, error);
      throw error;
    }
  }

  async toggleChatPause(chatId, pause) {
    try {
      console.log(`[WhatsAppChatRepository] Cambiando pausa del chat ${chatId} a ${pause}`);
      const action = pause ? 'pause' : 'resume';
      const apiPath = `${this._baseUrl}/chats/${chatId}/${action}`;
      
      const response = await fetch(apiPath, { method: 'POST' });
      if (!response.ok) throw new Error(`Error al ${action === 'pause' ? 'pausar' : 'reactivar'} el bot`);
      
      return await response.json();
    } catch (error) {
      console.error(`[WhatsAppChatRepository] Error en toggleChatPause:`, error);
      throw error;
    }
  }

  async searchMessages(query, startDate, endDate) {
    try {
      console.log(`[WhatsAppChatRepository] Buscando mensajes: q=${query}, start=${startDate}, end=${endDate}`);
      let apiPath = `${this._baseUrl}/messages/search?q=${encodeURIComponent(query)}`;
      
      if (startDate) apiPath += `&startDate=${encodeURIComponent(startDate)}`;
      if (endDate) apiPath += `&endDate=${encodeURIComponent(endDate)}`;

      const response = await fetch(apiPath);
      if (!response.ok) throw new Error("Error al buscar mensajes");
      
      return await response.json();
    } catch (error) {
      console.error(`[WhatsAppChatRepository] Error en searchMessages:`, error);
      throw error;
    }
  }

  async triggerStressTest() {
    try {
      console.log(`[WhatsAppChatRepository] Iniciando Test de Estrés`);
      const apiPath = `${this._baseUrl}/test/stress`;
      const response = await fetch(apiPath, { method: 'POST' });
      if (!response.ok) throw new Error("Error al iniciar el Stress Test");
      return await response.json();
    } catch (error) {
      console.error(`[WhatsAppChatRepository] Error en triggerStressTest:`, error);
      throw error;
    }
  }

  async triggerContinuity(chatId, minutes) {
    try {
      console.log(`[WhatsAppChatRepository] Simulando continuidad para ${chatId}`);
      const apiPath = `${this._baseUrl}/chats/${chatId}/continuity`;
      const response = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minutes })
      });
      if (!response.ok) throw new Error("Error al inyectar continuidad");
      return await response.json();
    } catch (error) {
      console.error(`[WhatsAppChatRepository] Error en triggerContinuity:`, error);
      throw error;
    }
  }
}

