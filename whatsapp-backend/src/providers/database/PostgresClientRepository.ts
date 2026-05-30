import { Pool } from "pg";
import { Client } from "../../core/entities/Client";
import { IClientRepository } from "../../core/interfaces/repositories/IClientRepository";
import logger from "../../infrastructure/logging/Logger";

export class PostgresClientRepository implements IClientRepository {
  public static readonly inMemoryClients = new Map<string, Client>();

  constructor(private readonly dbPool: Pool) {}

  async findByPhoneNumber(phoneNumber: string): Promise<Client | null> {
    try {
      const res = await this.dbPool.query(
        'SELECT id, phone_number, name, is_registered, metadata FROM clients WHERE phone_number = $1',
        [phoneNumber]
      );
      if (res.rows.length === 0) {
        return PostgresClientRepository.inMemoryClients.get(phoneNumber) || null;
      }
      const row = res.rows[0];
      const client = new Client(row.id, row.phone_number, row.name, row.is_registered, row.metadata || {});
      PostgresClientRepository.inMemoryClients.set(client.phoneNumber, client);
      return client;
    } catch (err) {
      logger.warn("[DB] findByPhoneNumber falló (modo demo), buscando en memoria", { error: (err as Error).message });
      return PostgresClientRepository.inMemoryClients.get(phoneNumber) || null;
    }
  }

  async findById(id: string): Promise<Client | null> {
    try {
      const res = await this.dbPool.query(
        'SELECT id, phone_number, name, is_registered, metadata FROM clients WHERE id = $1',
        [id]
      );
      if (res.rows.length === 0) {
        // Buscar por ID en memoria
        for (const client of PostgresClientRepository.inMemoryClients.values()) {
          if (client.id === id) return client;
        }
        return null;
      }
      const row = res.rows[0];
      const client = new Client(row.id, row.phone_number, row.name, row.is_registered, row.metadata || {});
      PostgresClientRepository.inMemoryClients.set(client.phoneNumber, client);
      return client;
    } catch (err) {
      logger.warn("[DB] findById falló (modo demo), buscando en memoria", { error: (err as Error).message });
      for (const client of PostgresClientRepository.inMemoryClients.values()) {
        if (client.id === id) return client;
      }
      return null;
    }
  }

  async findAll(): Promise<Client[]> {
    try {
      const res = await this.dbPool.query(
        'SELECT id, phone_number, name, is_registered, metadata FROM clients ORDER BY created_at DESC'
      );
      const dbClients = res.rows.map(row => new Client(row.id, row.phone_number, row.name, row.is_registered, row.metadata || {}));
      dbClients.forEach(client => {
        PostgresClientRepository.inMemoryClients.set(client.phoneNumber, client);
      });
      return dbClients;
    } catch (err) {
      logger.warn("[DB] findAll clients falló (modo demo), buscando en memoria", { error: (err as Error).message });
      return Array.from(PostgresClientRepository.inMemoryClients.values());
    }
  }

  async save(client: Client): Promise<void> {
    try {
      await this.dbPool.query(
        `INSERT INTO clients (id, phone_number, name, is_registered, metadata) 
         VALUES ($1, $2, $3, $4, $5) 
         ON CONFLICT (phone_number) 
         DO UPDATE SET name = $3, is_registered = $4, metadata = $5`,
        [client.id, client.phoneNumber, client.name, client.isRegistered, JSON.stringify(client.metadata || {})]
      );
    } catch (err) {
      logger.warn("[DB] save client falló (modo demo), guardando en memoria", { error: (err as Error).message });
    }
    // Siempre guardar en memoria
    PostgresClientRepository.inMemoryClients.set(client.phoneNumber, client);
  }
}
