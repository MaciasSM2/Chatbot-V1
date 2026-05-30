import { Message } from "../../entities/Message";

export interface IMessageRepository {
  save(message: Message): Promise<void>;
  findByUserId(userId: string): Promise<Message[]>;
  findLastByUserId(userId: string): Promise<Message | null>;
  findAll(): Promise<Message[]>;
  clearHistory(userId: string): Promise<void>;
  searchMessages(query: string, startDate?: Date, endDate?: Date): Promise<any[]>;
}
