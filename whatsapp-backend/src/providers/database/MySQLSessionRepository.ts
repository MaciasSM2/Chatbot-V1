import { ChatSession } from "../../core/entities/ChatSession";
import { ISessionRepository } from "../../core/interfaces/repositories/ISessionRepository";

function parseMetadata(metadata: any): Record<string, any> {
  if (!metadata) return {};
  if (typeof metadata === "string") {
    try {
      return JSON.parse(metadata);
    } catch (e) {
      return {};
    }
  }
  return metadata;
}

export class MySQLSessionRepository implements ISessionRepository {
  public static readonly inMemorySessions = new Map<string, ChatSession>();

  constructor(private readonly dbPool: any) {}

  async findByUserId(userId: string): Promise<ChatSession | null> {
    try {
      const [rows]: any = await this.dbPool.query('SELECT paso_actual as current_step, actualizado_en as updated_at, metadatos as metadata FROM sesiones_chat WHERE usuario_id = ?', [userId]);
      if (rows.length === 0) {
        return MySQLSessionRepository.inMemorySessions.get(userId) || null;
      }
      const metadata = parseMetadata(rows[0].metadata);
      const session = new ChatSession({
        userId,
        currentStep: rows[0].current_step,
        updatedAt: rows[0].updated_at,
        isPaused: !!metadata.isPaused,
        messageHistory: metadata.messageHistory || [],
        metadata: metadata
      });
      MySQLSessionRepository.inMemorySessions.set(userId, session);
      return session;
    } catch (err) {
      return MySQLSessionRepository.inMemorySessions.get(userId) || null;
    }
  }

  async save(session: ChatSession): Promise<void> {
    const metadata = { 
      isPaused: session.isPaused,
      messageHistory: session.history,
      ...session.metadata
    };
    try {
      await this.dbPool.query(
        'INSERT INTO sesiones_chat (usuario_id, paso_actual, actualizado_en, metadatos) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE paso_actual = VALUES(paso_actual), actualizado_en = VALUES(actualizado_en), metadatos = VALUES(metadatos)',
        [session.userId, session.currentStep, session.updatedAt, JSON.stringify(metadata)]
      );
    } catch (err) {
      // Ignorar error en modo demo
    }
    MySQLSessionRepository.inMemorySessions.set(session.userId, session);
  }

  async delete(userId: string): Promise<void> {
    try {
      await this.dbPool.query('DELETE FROM sesiones_chat WHERE usuario_id = ?', [userId]);
    } catch (err) {
      // Ignorar error en modo demo
    }
    MySQLSessionRepository.inMemorySessions.delete(userId);
  }

  async findAll(): Promise<ChatSession[]> {
    try {
      const [rows]: any = await this.dbPool.query('SELECT usuario_id as user_id, paso_actual as current_step, actualizado_en as updated_at, metadatos as metadata FROM sesiones_chat');
      const dbSessions = rows.map((row: any) => {
        const metadata = parseMetadata(row.metadata);
        return new ChatSession({
          userId: row.user_id,
          currentStep: row.current_step,
          updatedAt: row.updated_at,
          isPaused: !!metadata.isPaused,
          messageHistory: metadata.messageHistory || [],
          metadata: metadata
        });
      });
      dbSessions.forEach((s: any) => {
        MySQLSessionRepository.inMemorySessions.set(s.userId, s);
      });
      return dbSessions;
    } catch (err) {
      return Array.from(MySQLSessionRepository.inMemorySessions.values());
    }
  }
}
