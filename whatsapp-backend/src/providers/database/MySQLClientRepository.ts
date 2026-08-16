import { Pool, RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { Client } from "../../core/entities/Client";
import { IClientRepository } from "../../core/interfaces/repositories/IClientRepository";
import logger from "../../infrastructure/logging/Logger";

function parseMetadata(metadata: any): Record<string, any> {
  if (!metadata) return {};
  let parsed: Record<string, any> = {};
  if (typeof metadata === "string") {
    try {
      parsed = JSON.parse(metadata);
    } catch (e) {
      parsed = {};
    }
  } else {
    parsed = { ...metadata };
  }
  if (parsed.ciudad && !parsed.city) {
    parsed.city = parsed.ciudad;
  }
  if (parsed.city && !parsed.ciudad) {
    parsed.ciudad = parsed.city;
  }
  return parsed;
}

import crypto from 'crypto';

export class MySQLClientRepository implements IClientRepository {
  public static readonly inMemoryClients = new Map<string, Client>();
  private readonly ALGORITHM = 'aes-256-gcm';
  private readonly SECRET_KEY: Buffer;

  constructor(private readonly dbPool: Pool) {
    const rawSecret = process.env.JWT_SECRET || '';
    this.SECRET_KEY = crypto.scryptSync(rawSecret, 'salt_colombia_logistica', 32);
  }

  private encryptValue(plainText: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this.ALGORITHM, this.SECRET_KEY, iv);
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}.${authTag}.${encrypted}`;
  }

  private decryptValue(encryptedPackage: string): string {
    try {
      const [ivHex, authTagHex, cipherTextHex] = encryptedPackage.split('.');
      if (!ivHex || !authTagHex || !cipherTextHex) return encryptedPackage;
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const decipher = crypto.createDecipheriv(this.ALGORITHM, this.SECRET_KEY, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(cipherTextHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (decryptionError) {
      throw new Error('Alerta de seguridad: Datos manipulados o llave criptográfica inconsistente.');
    }
  }

  async findByPhoneNumber(phoneNumber: string): Promise<Client | null> {
    try {
      const [rows] = await this.dbPool.query<RowDataPacket[]>(
        `SELECT phone_number, full_name, gender, document_type, document_number, email, rut_file_path, is_registered, is_paused, metadata 
         FROM clients WHERE phone_number = ?`,
        [phoneNumber]
      );
      if (rows.length === 0) {
        return MySQLClientRepository.inMemoryClients.get(phoneNumber) || null;
      }
      const row = rows[0]!;
      const decryptedDocNumber = row.document_number ? this.decryptValue(row.document_number) : null;
      const metadata = parseMetadata(row.metadata);
      if (row.gender) {
        metadata.gender = row.gender === 'F' ? 'Dama' : (row.gender === 'M' ? 'Caballero' : 'No especificado');
      }
      if (row.is_paused !== undefined) {
        metadata.isPaused = row.is_paused === 1;
      }
      if (row.document_type) {
        metadata.document_type = row.document_type;
        metadata.docType = row.document_type;
      }
      if (decryptedDocNumber) {
        metadata.document_number = decryptedDocNumber;
        metadata.docNumber = decryptedDocNumber;
      }
      if (row.email) {
        metadata.email = row.email;
      }
      if (row.rut_file_path) {
        metadata.rut_file_path = row.rut_file_path;
        metadata.rutFilePath = row.rut_file_path;
      }
      const client = new Client(
        row.phone_number,
        row.phone_number,
        row.full_name,
        row.is_registered === 1,
        metadata
      );
      MySQLClientRepository.inMemoryClients.set(client.phoneNumber, client);
      return client;
    } catch (err) {
      logger.warn("[DB] findByPhoneNumber falló (modo demo), buscando en memoria", { error: (err as Error).message });
      return MySQLClientRepository.inMemoryClients.get(phoneNumber) || null;
    }
  }

  async findById(id: string): Promise<Client | null> {
    return this.findByPhoneNumber(id);
  }

  async findAll(): Promise<Client[]> {
    try {
      const [rows] = await this.dbPool.query<RowDataPacket[]>(
        'SELECT phone_number, full_name, is_registered, gender, document_type, document_number, email, rut_file_path, metadata FROM clients ORDER BY phone_number DESC'
      );
      const dbClients = rows.map((row: RowDataPacket) => {
        const decryptedDocNumber = row.document_number ? this.decryptValue(row.document_number) : null;
        const metadata = parseMetadata(row.metadata);
        if (row.gender) {
          metadata.gender = row.gender === 'F' ? 'Dama' : (row.gender === 'M' ? 'Caballero' : 'No especificado');
        }
        if (row.document_type) {
          metadata.document_type = row.document_type;
          metadata.docType = row.document_type;
        }
        if (decryptedDocNumber) {
          metadata.document_number = decryptedDocNumber;
          metadata.docNumber = decryptedDocNumber;
        }
        if (row.email) {
          metadata.email = row.email;
        }
        if (row.rut_file_path) {
          metadata.rut_file_path = row.rut_file_path;
          metadata.rutFilePath = row.rut_file_path;
        }
        return new Client(
          row.phone_number,
          row.phone_number,
          row.full_name,
          row.is_registered === 1,
          metadata
        );
      });
      dbClients.forEach((client) => {
        MySQLClientRepository.inMemoryClients.set(client.phoneNumber, client);
      });
      return dbClients;
    } catch (err) {
      logger.warn("[DB] findAll clients falló (modo demo), buscando en memoria", { error: (err as Error).message });
      return Array.from(MySQLClientRepository.inMemoryClients.values());
    }
  }

  async save(client: Client): Promise<void> {
    const genderVal = client.metadata?.gender === 'Dama' || client.metadata?.gender === 'F' ? 'F' : (client.metadata?.gender === 'Caballero' || client.metadata?.gender === 'M' ? 'M' : 'N');
    const docType = client.metadata?.document_type || client.metadata?.docType || null;
    const docNumber = client.metadata?.document_number || client.metadata?.docNumber || null;
    const encryptedDocNumber = docNumber ? this.encryptValue(docNumber) : null;
    const email = client.metadata?.email || null;
    const rutFilePath = client.metadata?.rut_file_path || client.metadata?.rutFilePath || null;
    try {
      await this.dbPool.query(
        `INSERT INTO clients (phone_number, full_name, is_registered, gender, document_type, document_number, email, rut_file_path, metadata) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE 
           full_name = VALUES(full_name), 
           is_registered = VALUES(is_registered), 
           gender = VALUES(gender),
           document_type = VALUES(document_type),
           document_number = VALUES(document_number),
           email = VALUES(email),
           rut_file_path = VALUES(rut_file_path),
           metadata = VALUES(metadata)`,
        [
          client.phoneNumber, 
          client.name, 
          client.isRegistered ? 1 : 0, 
          genderVal, 
          docType, 
          encryptedDocNumber, 
          email, 
          rutFilePath, 
          JSON.stringify(client.metadata || {})
        ]
      );
    } catch (err) {
      logger.warn("[DB] save client falló (modo demo), guardando en memoria", { error: (err as Error).message });
    }
    MySQLClientRepository.inMemoryClients.set(client.phoneNumber, client);
  }

  async updateCrmData(phone: string, data: Partial<{ email: string, secondary_phone: string }>): Promise<boolean> {
    try {
      const [result] = await this.dbPool.query<ResultSetHeader>(
        `UPDATE clients 
         SET 
           email = COALESCE(?, email),
           metadata = JSON_SET(COALESCE(metadata, '{}'), '$.secondary_phone', COALESCE(?, JSON_UNQUOTE(JSON_EXTRACT(COALESCE(metadata, '{}'), '$.secondary_phone')))),
           is_registered = TRUE
         WHERE phone_number = ?`,
        [data.email, data.secondary_phone, phone]
      );
      return result.affectedRows > 0;
    } catch (err) {
      logger.warn("[DB] updateCrmData falló", { error: (err as Error).message });
      const client = MySQLClientRepository.inMemoryClients.get(phone);
      if (client) {
        const updatedMetadata = { ...client.metadata, ...data };
        const updatedClient = new Client(client.id, client.phoneNumber, client.name, true, updatedMetadata);
        MySQLClientRepository.inMemoryClients.set(phone, updatedClient);
        return true;
      }
      return false;
    }
  }

  async updateRutDocument(phone: string, filePath: string): Promise<boolean> {
    try {
      const [result] = await this.dbPool.query<ResultSetHeader>(
        `UPDATE clients 
         SET 
           rut_file_path = ?
         WHERE phone_number = ?`,
        [filePath, phone]
      );
      return result.affectedRows > 0;
    } catch (err) {
      logger.warn("[DB] updateRutDocument falló", { error: (err as Error).message });
      const client = MySQLClientRepository.inMemoryClients.get(phone);
      if (client) {
        const updatedMetadata = { ...client.metadata, rut_file_path: filePath };
        const updatedClient = new Client(client.id, client.phoneNumber, client.name, client.isRegistered, updatedMetadata);
        MySQLClientRepository.inMemoryClients.set(phone, updatedClient);
        return true;
      }
      return false;
    }
  }

  public async silentRegister(phoneNumber: string): Promise<void> {
    try {
      await this.dbPool.query(
        `INSERT INTO clients (phone_number, full_name, is_registered, is_paused, metadata)
         VALUES (?, ?, 0, 0, '{}')
         ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP`,
        [phoneNumber, `Prospecto ${phoneNumber}`]
      );
    } catch (err) {
      logger.warn("[DB] silentRegister falló (modo demo)", { error: (err as Error).message });
    }
    if (!MySQLClientRepository.inMemoryClients.has(phoneNumber)) {
      const client = new Client(phoneNumber, phoneNumber, `Prospecto ${phoneNumber}`, false, {});
      MySQLClientRepository.inMemoryClients.set(phoneNumber, client);
    }
  }

  public async getAll(): Promise<any[]> {
    try {
      const [rows] = await this.dbPool.query<RowDataPacket[]>(
        `SELECT 
          phone_number as phoneNumber,
          full_name as fullName,
          email,
          document_type as documentType,
          document_number as documentNumber,
          rut_file_path as rutFilePath,
          is_registered as isRegistered,
          gender,
          metadata
         FROM clients
         ORDER BY phone_number DESC`
      );
      
      return rows.map((row) => {
        let metadata: any = {};
        if (row.metadata) {
          try {
            metadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;
          } catch (e) {
            metadata = {};
          }
        }
        if (row.gender) {
          metadata.gender = row.gender === 'F' ? 'Dama' : (row.gender === 'M' ? 'Caballero' : 'No especificado');
        }
        
        const history = metadata.history || metadata || {};
        
        const decryptedDocNumber = row.documentNumber ? this.decryptValue(row.documentNumber) : null;
        
        return {
          id: row.phoneNumber,
          phoneNumber: row.phoneNumber,
          fullName: row.fullName,
          documentType: row.documentType || history.docType || history.document_type || null,
          documentNumber: decryptedDocNumber || history.docNumber || history.document_number || null,
          email: row.email || history.email || null,
          secondaryPhone: metadata.secondary_phone || null,
          rutFilePath: row.rutFilePath || history.rut_file_path || history.rutFilePath || null,
          isRegistered: row.isRegistered === 1
        };
      });
    } catch (err) {
      logger.warn("[DB] getAll clients falló (modo demo), retornando en memoria", { error: (err as Error).message });
      return Array.from(MySQLClientRepository.inMemoryClients.values()).map(c => {
        const history = c.metadata || {};
        return {
          id: c.id || c.phoneNumber,
          phoneNumber: c.phoneNumber,
          fullName: c.name,
          documentType: history.docType || null,
          documentNumber: history.docNumber || null,
          email: history.email || null,
          secondaryPhone: history.secondary_phone || null,
          rutFilePath: history.rut_file_path || null,
          isRegistered: c.isRegistered
        };
      });
    }
  }

  public async getAllRaw(): Promise<any[]> {
    try {
      const [rows] = await this.dbPool.query<RowDataPacket[]>(
        `SELECT phone_number, full_name, gender, document_type, document_number, email, rut_file_path, is_registered, is_paused, metadata 
         FROM clients 
         ORDER BY phone_number DESC`
      );
      return rows.map(row => {
        let metadata = {};
        if (row.metadata) {
          try {
            metadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;
          } catch (e) {
            metadata = {};
          }
        }
        const decryptedDocNumber = row.document_number ? this.decryptValue(row.document_number) : null;
        return {
          phone_number: row.phone_number,
          full_name: row.full_name,
          gender: row.gender || 'N',
          document_type: row.document_type,
          document_number: decryptedDocNumber,
          email: row.email,
          rut_file_path: row.rut_file_path,
          is_registered: row.is_registered,
          is_paused: row.is_paused,
          metadata: metadata
        };
      });
    } catch (err) {
      logger.warn("[DB] getAllRaw falló, retornando memoria", { error: (err as Error).message });
      return Array.from(MySQLClientRepository.inMemoryClients.values()).map(c => {
        const genderVal = c.metadata?.gender === 'Dama' || c.metadata?.gender === 'F' ? 'F' : (c.metadata?.gender === 'Caballero' || c.metadata?.gender === 'M' ? 'M' : 'N');
        return {
          phone_number: c.phoneNumber,
          full_name: c.name,
          gender: genderVal,
          document_type: c.metadata?.document_type || null,
          document_number: c.metadata?.document_number || null,
          email: c.metadata?.email || null,
          rut_file_path: c.metadata?.rut_file_path || null,
          is_registered: c.isRegistered ? 1 : 0,
          is_paused: c.metadata?.isPaused ? 1 : 0,
          metadata: c.metadata || {}
        };
      });
    }
  }


  public async updatePauseStatus(phoneNumber: string, isPaused: boolean): Promise<boolean> {
    try {
      const [result] = await this.dbPool.query<ResultSetHeader>(
        `UPDATE clients SET is_paused = ? WHERE phone_number = ?`,
        [isPaused ? 1 : 0, phoneNumber]
      );
      return result.affectedRows > 0;
    } catch (err) {
      logger.warn("[DB] updatePauseStatus falló", { error: (err as Error).message });
      const client = MySQLClientRepository.inMemoryClients.get(phoneNumber);
      if (client) {
        client.metadata.isPaused = isPaused;
        return true;
      }
      return false;
    }
  }
}
