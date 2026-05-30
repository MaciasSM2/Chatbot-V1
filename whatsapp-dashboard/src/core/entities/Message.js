export class Message {
  #id;
  #sender;
  #text;
  #timestamp;
  #status;

  constructor({ id, sender, text, timestamp = new Date(), status = 'sent' }) {
    this.#id = id;
    this.#sender = sender; // 'user' | 'bot' | 'agent' | 'system'
    this.#text = text;
    this.#timestamp = new Date(timestamp);
    this.#status = status;
    
    if (!text || text.trim() === '') {
      throw new Error("El contenido del mensaje no puede estar vacío.");
    }
  }

  get id() { return this.#id; }
  get sender() { return this.#sender; }
  get text() { return this.#text; }
  get timestamp() { return this.#timestamp; }
  get status() { return this.#status; }

  get isFromBot() {
    return this.#sender === 'bot';
  }

  get formattedTime() {
    return this.#timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  updateStatus(newStatus) {
    const validStatuses = ['sent', 'delivered', 'read'];
    if (validStatuses.includes(newStatus)) {
      this.#status = newStatus;
    }
  }
}
