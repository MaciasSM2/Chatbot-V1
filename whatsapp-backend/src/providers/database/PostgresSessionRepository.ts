import { Pool } from "pg";
import { ChatSession } from "../../core/entities/ChatSession";
import { ISessionRepository } from "../../core/interfaces/repositories/ISessionRepository";

export class PostgresSessionRepository implements ISessionRepository {
  public static readonly inMemorySessions = new Map<string, ChatSession>();

  constructor(private readonly dbPool: Pool) {}

  async findByUserId(userId: string): Promise<ChatSession | null> {
    try {
      const res = await this.dbPool.query('SELECT current_step, updated_at, metadata FROM chat_sessions WHERE user_id = $1', [userId]);
      if (res.rows.length === 0) {
        return PostgresSessionRepository.inMemorySessions.get(userId) || null;
      }
      const metadata = res.rows[0].metadata || {};
      const session = new ChatSession({
        userId,
        currentStep: res.rows[0].current_step,
        updatedAt: res.rows[0].updated_at,
        isPaused: !!metadata.isPaused,
        messageHistory: metadata.messageHistory || [],
        metadata: metadata
      });
      PostgresSessionRepository.inMemorySessions.set(userId, session);
      return session;
    } catch (err) {
      return PostgresSessionRepository.inMemorySessions.get(userId) || null;
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
        'INSERT INTO chat_sessions (user_id, current_step, updated_at, metadata) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id) DO UPDATE SET current_step = $2, updated_at = $3, metadata = $4',
        [session.userId, session.currentStep, session.updatedAt, JSON.stringify(metadata)]
      );
    } catch (err) {
      // Ignorar error en modo demo
    }
    PostgresSessionRepository.inMemorySessions.set(session.userId, session);
  }

  async delete(userId: string): Promise<void> {
    try {
      await this.dbPool.query('DELETE FROM chat_sessions WHERE user_id = $1', [userId]);
    } catch (err) {
      // Ignorar error en modo demo
    }
    PostgresSessionRepository.inMemorySessions.delete(userId);
  }

  async findAll(): Promise<ChatSession[]> {
    try {
      const res = await this.dbPool.query('SELECT user_id, current_step, updated_at, metadata FROM chat_sessions');
      const dbSessions = res.rows.map(row => {
        const metadata = row.metadata || {};
        return new ChatSession({
          userId: row.user_id,
          currentStep: row.current_step,
          updatedAt: row.updated_at,
          isPaused: !!metadata.isPaused,
          messageHistory: metadata.messageHistory || [],
          metadata: metadata
        });
      });
      dbSessions.forEach(s => {
        PostgresSessionRepository.inMemorySessions.set(s.userId, s);
      });
      return dbSessions;
    } catch (err) {
      return Array.from(PostgresSessionRepository.inMemorySessions.values());
    }
  }
}
