import { Pool } from "pg";
import { Message } from "../../core/entities/Message";
import { IMessageRepository } from "../../core/interfaces/repositories/IMessageRepository";
import logger from "../../infrastructure/logging/Logger";
import { PostgresClientRepository } from "./PostgresClientRepository";

export class PostgresMessageRepository implements IMessageRepository {
  private static readonly inMemoryMessages: Message[] = [];

  constructor(private readonly dbPool: Pool) {}

  async save(message: Message): Promise<void> {
    try {
      await this.dbPool.query(
        `INSERT INTO messages (id, user_id, sender, text, status, timestamp) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         ON CONFLICT (id) DO NOTHING`,
        [message.id, message.userId, message.sender, message.text, message.status, message.timestamp]
      );
    } catch (err) {
      logger.warn("[DB] save message falló (modo demo), guardando en memoria", { error: (err as Error).message });
    }
    // Siempre guardar en memoria como respaldo / fallback
    const exists = PostgresMessageRepository.inMemoryMessages.some(m => m.id === message.id);
    if (!exists) {
      PostgresMessageRepository.inMemoryMessages.push(message);
    }
  }

  async findByUserId(userId: string): Promise<Message[]> {
    try {
      const res = await this.dbPool.query(
        'SELECT id, user_id, sender, text, status, timestamp FROM messages WHERE user_id = $1 ORDER BY timestamp ASC',
        [userId]
      );
      const dbMsgs = res.rows.map(row => new Message(
        row.id, row.user_id, row.sender as 'user' | 'bot', row.text, row.status, row.timestamp
      ));
      // Sincronizar memoria con los cargados de DB
      dbMsgs.forEach(msg => {
        if (!PostgresMessageRepository.inMemoryMessages.some(m => m.id === msg.id)) {
          PostgresMessageRepository.inMemoryMessages.push(msg);
        }
      });
      return dbMsgs;
    } catch (err) {
      logger.warn("[DB] findByUserId falló (modo demo), buscando en memoria", { error: (err as Error).message });
      return PostgresMessageRepository.inMemoryMessages
        .filter(m => m.userId === userId)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }
  }

  async findLastByUserId(userId: string): Promise<Message | null> {
    try {
      const res = await this.dbPool.query(
        'SELECT id, user_id, sender, text, status, timestamp FROM messages WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 1',
        [userId]
      );
      if (res.rows.length === 0) return null;
      
      const row = res.rows[0];
      return new Message(row.id, row.user_id, row.sender as 'user' | 'bot', row.text, row.status, row.timestamp);
    } catch (err) {
      logger.warn("[DB] findLastByUserId falló (modo demo), buscando en memoria", { error: (err as Error).message });
      const msgs = PostgresMessageRepository.inMemoryMessages
        .filter(m => m.userId === userId)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      return msgs.length > 0 ? (msgs[0] || null) : null;
    }
  }

  async findAll(): Promise<Message[]> {
    try {
      const res = await this.dbPool.query(
        'SELECT id, user_id, sender, text, status, timestamp FROM messages ORDER BY timestamp ASC'
      );
      const dbMsgs = res.rows.map(row => new Message(
        row.id, row.user_id, row.sender as 'user' | 'bot', row.text, row.status, row.timestamp
      ));
      dbMsgs.forEach(msg => {
        if (!PostgresMessageRepository.inMemoryMessages.some(m => m.id === msg.id)) {
          PostgresMessageRepository.inMemoryMessages.push(msg);
        }
      });
      return dbMsgs;
    } catch (err) {
      logger.warn("[DB] findAll messages falló (modo demo), buscando en memoria", { error: (err as Error).message });
      return PostgresMessageRepository.inMemoryMessages
        .slice()
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }
  }

  async clearHistory(userId: string): Promise<void> {
    try {
      await this.dbPool.query('DELETE FROM messages WHERE user_id = $1', [userId]);
    } catch (err) {
      logger.warn("[DB] clearHistory falló (modo demo), limpiando de memoria", { error: (err as Error).message });
    }
    // Siempre limpiar de la memoria
    let i = PostgresMessageRepository.inMemoryMessages.length;
    while (i--) {
      const msg = PostgresMessageRepository.inMemoryMessages[i];
      if (msg && msg.userId === userId) {
        PostgresMessageRepository.inMemoryMessages.splice(i, 1);
      }
    }
  }

  async searchMessages(query: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    try {
      let sql = `
        SELECT m.id, m.user_id as "userId", m.sender, m.text, m.status, m.timestamp, c.name as "clientName"
        FROM messages m
        LEFT JOIN clients c ON m.user_id = c.phone_number
        WHERE m.text ILIKE $1
      `;
      const params: any[] = [`%${query}%`];

      if (startDate) {
        params.push(startDate);
        sql += ` AND m.timestamp >= $${params.length}`;
      }
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        params.push(endOfDay);
        sql += ` AND m.timestamp <= $${params.length}`;
      }

      sql += ` ORDER BY m.timestamp DESC`;

      const res = await this.dbPool.query(sql, params);
      return res.rows;
    } catch (err) {
      logger.warn("[DB] searchMessages falló (modo demo), buscando en memoria", { error: (err as Error).message });
      const lowerQuery = query.toLowerCase();
      let results = PostgresMessageRepository.inMemoryMessages
        .filter(m => m.text.toLowerCase().includes(lowerQuery));

      if (startDate) {
        results = results.filter(m => m.timestamp >= startDate);
      }
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        results = results.filter(m => m.timestamp <= endOfDay);
      }

      return results
        .map(m => {
          const client = PostgresClientRepository.inMemoryClients.get(m.userId);
          return {
            id: m.id,
            userId: m.userId,
            sender: m.sender,
            text: m.text,
            status: m.status,
            timestamp: m.timestamp,
            clientName: client ? client.name : null
          };
        })
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
  }
}
