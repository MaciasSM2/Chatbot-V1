import { Message } from "../../core/entities/Message";
import { IMessageRepository } from "../../core/interfaces/repositories/IMessageRepository";
import logger from "../../infrastructure/logging/Logger";
import { MySQLClientRepository } from "./MySQLClientRepository";

export class MySQLMessageRepository implements IMessageRepository {
  private static readonly inMemoryMessages: Message[] = [];

  constructor(private readonly dbPool: any) {}

  async save(message: Message): Promise<void> {
    try {
      await this.dbPool.query(
        `INSERT INTO mensajes (id, usuario_id, remitente, texto, estado, marca_tiempo) 
         VALUES (?, ?, ?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE id=id`,
        [message.id, message.userId, message.sender, message.text, message.status, message.timestamp]
      );
    } catch (err) {
      logger.warn("[DB] save message falló (modo demo), guardando en memoria", { error: (err as Error).message });
    }
    // Siempre guardar en memoria como respaldo / fallback
    const exists = MySQLMessageRepository.inMemoryMessages.some(m => m.id === message.id);
    if (!exists) {
      MySQLMessageRepository.inMemoryMessages.push(message);
    }
  }

  async findByUserId(userId: string): Promise<Message[]> {
    try {
      const [rows]: any = await this.dbPool.query(
        'SELECT id, usuario_id as user_id, remitente as sender, texto as text, estado as status, marca_tiempo as timestamp FROM mensajes WHERE usuario_id = ? ORDER BY marca_tiempo ASC',
        [userId]
      );
      const dbMsgs = rows.map((row: any) => new Message(
        row.id, row.user_id, row.sender as 'user' | 'bot', row.text, row.status, row.timestamp
      ));
      // Sincronizar memoria con los cargados de DB
      dbMsgs.forEach((msg: any) => {
        if (!MySQLMessageRepository.inMemoryMessages.some(m => m.id === msg.id)) {
          MySQLMessageRepository.inMemoryMessages.push(msg);
        }
      });
      return dbMsgs;
    } catch (err) {
      logger.warn("[DB] findByUserId falló (modo demo), buscando en memoria", { error: (err as Error).message });
      return MySQLMessageRepository.inMemoryMessages
        .filter(m => m.userId === userId)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }
  }

  async findLastByUserId(userId: string): Promise<Message | null> {
    try {
      const [rows]: any = await this.dbPool.query(
        'SELECT id, usuario_id as user_id, remitente as sender, texto as text, estado as status, marca_tiempo as timestamp FROM mensajes WHERE usuario_id = ? ORDER BY marca_tiempo DESC LIMIT 1',
        [userId]
      );
      if (rows.length === 0) return null;
      
      const row = rows[0];
      return new Message(row.id, row.user_id, row.sender as 'user' | 'bot', row.text, row.status, row.timestamp);
    } catch (err) {
      logger.warn("[DB] findLastByUserId falló (modo demo), buscando en memoria", { error: (err as Error).message });
      const msgs = MySQLMessageRepository.inMemoryMessages
        .filter(m => m.userId === userId)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      return msgs.length > 0 ? (msgs[0] || null) : null;
    }
  }

  async findAll(): Promise<Message[]> {
    try {
      const [rows]: any = await this.dbPool.query(
        'SELECT id, usuario_id as user_id, remitente as sender, texto as text, estado as status, marca_tiempo as timestamp FROM mensajes ORDER BY marca_tiempo ASC'
      );
      const dbMsgs = rows.map((row: any) => new Message(
        row.id, row.user_id, row.sender as 'user' | 'bot', row.text, row.status, row.timestamp
      ));
      dbMsgs.forEach((msg: any) => {
        if (!MySQLMessageRepository.inMemoryMessages.some(m => m.id === msg.id)) {
          MySQLMessageRepository.inMemoryMessages.push(msg);
        }
      });
      return dbMsgs;
    } catch (err) {
      logger.warn("[DB] findAll messages falló (modo demo), buscando en memoria", { error: (err as Error).message });
      return MySQLMessageRepository.inMemoryMessages
        .slice()
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }
  }

  async clearHistory(userId: string): Promise<void> {
    try {
      await this.dbPool.query('DELETE FROM mensajes WHERE usuario_id = ?', [userId]);
    } catch (err) {
      logger.warn("[DB] clearHistory falló (modo demo), limpiando de memoria", { error: (err as Error).message });
    }
    // Siempre limpiar de la memoria
    let i = MySQLMessageRepository.inMemoryMessages.length;
    while (i--) {
      const msg = MySQLMessageRepository.inMemoryMessages[i];
      if (msg && msg.userId === userId) {
        MySQLMessageRepository.inMemoryMessages.splice(i, 1);
      }
    }
  }

  async searchMessages(query: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    try {
      let sql = `
        SELECT m.id, m.usuario_id as userId, m.remitente as sender, m.texto as text, m.estado as status, m.marca_tiempo as timestamp, c.full_name as clientName
        FROM mensajes m
        LEFT JOIN clients c ON m.usuario_id = c.phone_number
        WHERE m.texto LIKE ?
      `;
      const params: any[] = [`%${query}%`];

      if (startDate) {
        params.push(startDate);
        sql += ` AND m.marca_tiempo >= ?`;
      }
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        params.push(endOfDay);
        sql += ` AND m.marca_tiempo <= ?`;
      }

      sql += ` ORDER BY m.marca_tiempo DESC`;

      const [rows]: any = await this.dbPool.query(sql, params);
      return rows;
    } catch (err) {
      logger.warn("[DB] searchMessages falló (modo demo), buscando en memoria", { error: (err as Error).message });
      const lowerQuery = query.toLowerCase();
      let results = MySQLMessageRepository.inMemoryMessages
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
          const client = MySQLClientRepository.inMemoryClients.get(m.userId);
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
