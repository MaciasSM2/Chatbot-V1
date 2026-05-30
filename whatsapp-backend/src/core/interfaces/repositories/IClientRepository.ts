import { Client } from "../../entities/Client";

export interface IClientRepository {
  findByPhoneNumber(phoneNumber: string): Promise<Client | null>;
  findById(id: string): Promise<Client | null>;
  findAll(): Promise<Client[]>;
  save(client: Client): Promise<void>;
}
