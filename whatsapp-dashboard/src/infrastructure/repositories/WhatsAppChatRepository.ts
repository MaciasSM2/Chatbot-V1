import { Message } from '../../core/entities/Message';
import { IChatRepository } from '../../core/interfaces/IChatRepository';
import { getApiUrl, executeSecureRequest } from '../../core/apiClient';

export class WhatsAppChatRepository extends IChatRepository {
  _baseUrl: string;

  constructor(baseUrl?: string) {
    super();
    this._baseUrl = baseUrl || getApiUrl();
  }

  async getChatHistory(chatId: string) {
    try {
      const apiPath = `${this._baseUrl}/messages/${chatId}`;
      const result: any = await executeSecureRequest(apiPath);
      const data = result.data || result;
      return data.map((msg: any) => new Message({
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
      const apiPath = `${this._baseUrl}/chats`;
      const result: any = await executeSecureRequest(apiPath);
      return result.data || result;
    } catch (error) {
      console.error(`[WhatsAppChatRepository] Error en getActiveChats:`, error);
      throw error;
    }
  }

  async sendMessage(chatId: string, text: string, customResponse: any = null, file: any = null) {
    try {
      const isSim = chatId === 'TEST_BOT_DEBUG';
      const url = isSim ? `${this._baseUrl}/simulator/message` : `${this._baseUrl}/webhook`;

      let filePayload = null;
      if (isSim && file && file.buffer) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const resultString = reader.result as string;
            const base64String = resultString.split(',')[1];
            resolve(base64String);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file.buffer);
        });
        filePayload = {
          buffer: base64,
          name: file.name
        };
      }

      const body: any = isSim 
        ? { phone: chatId, message: text } 
        : { userId: chatId, messageBody: text, messageId: `sim_${Date.now()}`, customResponse: customResponse };

      if (isSim && filePayload) {
        body.file = filePayload;
      }

      await executeSecureRequest(url, {
        method: 'POST',
        body: JSON.stringify(body)
      });

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

  async fetchGreetingByCategory(category: string) {
    try {
      const apiPath = `${this._baseUrl}/greetings?category=${category}`;
      const result: any = await executeSecureRequest(apiPath);
      const data = result.data || result;
      if (!data || data.length === 0) {
        throw new Error("No hay saludos configurados para esta categoría");
      }
      const randomIndex = Math.floor(Math.random() * data.length);
      return data[randomIndex];
    } catch (error) {
      console.error(`[WhatsAppChatRepository] Error en fetchGreetingByCategory:`, error);
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

  async resetChat(chatId: string) {
    try {
      const apiPath = `${this._baseUrl}/messages/${chatId}`;
      const result: any = await executeSecureRequest(apiPath, { method: 'DELETE' });
      return result.data || result;
    } catch (error) {
      console.error(`[WhatsAppChatRepository] Error en resetChat:`, error);
      throw error;
    }
  }

  async toggleChatPause(chatId: string, pause: boolean) {
    try {
      const action = pause ? 'pause' : 'resume';
      const apiPath = `${this._baseUrl}/chats/${chatId}/${action}`;
      const result: any = await executeSecureRequest(apiPath, { method: 'POST' });
      return result.data || result;
    } catch (error) {
      console.error(`[WhatsAppChatRepository] Error en toggleChatPause:`, error);
      throw error;
    }
  }

  async searchMessages(query: string, startDate?: string, endDate?: string) {
    try {
      let apiPath = `${this._baseUrl}/messages/search?q=${encodeURIComponent(query)}`;
      if (startDate) apiPath += `&startDate=${encodeURIComponent(startDate)}`;
      if (endDate) apiPath += `&endDate=${encodeURIComponent(endDate)}`;
      const result: any = await executeSecureRequest(apiPath);
      return result.data || result;
    } catch (error) {
      console.error(`[WhatsAppChatRepository] Error en searchMessages:`, error);
      throw error;
    }
  }

  async triggerStressTest() {
    try {
      const apiPath = `${this._baseUrl}/test/stress`;
      const result: any = await executeSecureRequest(apiPath, { method: 'POST' });
      return result.data || result;
    } catch (error) {
      console.error(`[WhatsAppChatRepository] Error en triggerStressTest:`, error);
      throw error;
    }
  }

  async triggerContinuity(chatId: string, minutes: number) {
    try {
      const apiPath = `${this._baseUrl}/chats/${chatId}/continuity`;
      const result: any = await executeSecureRequest(apiPath, {
        method: 'POST',
        body: JSON.stringify({ minutes })
      });
      return result.data || result;
    } catch (error) {
      console.error(`[WhatsAppChatRepository] Error en triggerContinuity:`, error);
      throw error;
    }
  }
}

