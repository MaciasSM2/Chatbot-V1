export class IChatRepository {
  /**
   * Obtiene el historial de mensajes
   * @param {string} chatId 
   * @returns {Promise<Message[]>}
   */
  async getChatHistory(chatId) {
    throw new Error("Método 'getChatHistory()' debe ser implementado.");
  }

  /**
   * Envía un mensaje al backend
   * @param {string} chatId 
   * @param {string} text 
   * @returns {Promise<Message>}
   */
  async sendMessage(chatId, text) {
    throw new Error("Método 'sendMessage()' debe ser implementado.");
  }

  /**
   * Obtiene un saludo aleatorio por categoría
   * @param {string} category 
   * @returns {Promise<any>}
   */
  async fetchGreetingByCategory(category) {
    throw new Error("Método 'fetchGreetingByCategory()' debe ser implementado.");
  }

  /**
   * Resetea el chat (Hard Reset)
   * @param {string} chatId 
   * @returns {Promise<void>}
   */
  async resetChat(chatId) {
    throw new Error("Método 'resetChat()' debe ser implementado.");
  }
}
