import { ChatSession } from "../../../core/entities/ChatSession";

export interface ISessionRepository {
  findByUserId(userId: string): Promise<ChatSession | null>;
  save(session: ChatSession): Promise<void>;
  delete(userId: string): Promise<void>;
  findAll(): Promise<ChatSession[]>;
}
