/**
 * @file MySQLTenantRepository.ts
 * @description Repositorio Multi-Tenant con cifrado simétrico AES-256-GCM para llaves de API y almacenamiento de documentos.
 */

import { Pool, RowDataPacket } from 'mysql2/promise';
import logger from '../../logging/Logger';
import { ITenantRepository, ITenantApiKeyConfig, ITenantUserRecord } from '../../../core/interfaces/repositories/ITenantRepository';
import { TenantSecurityService } from '../../../core/services/TenantSecurityService';

export interface ITenantConfig {
  tenantId: string;
  name: string;
  role: 'VIEWER' | 'ADMIN_A' | 'ADMIN_B' | 'ADMIN_C';
  openaiApiKey?: string | undefined;
  aiModel?: string | undefined;
}

export class MySQLTenantRepository implements ITenantRepository {
  private static readonly inMemoryTenants = new Map<string, ITenantConfig>();
  private static readonly inMemorySummaries = new Map<string, string>();
  private static readonly inMemoryDocuments = new Map<string, string>();
  private static readonly inMemoryParsedTrees = new Map<string, string>();

  constructor(
    private readonly mariadbPool: Pool,
    private readonly securityService: TenantSecurityService
  ) {
    // Sembrar tenants de demostración por defecto
    MySQLTenantRepository.inMemoryTenants.set('tenant-demo', {
      tenantId: 'tenant-demo',
      name: 'Empresa Logística Demo',
      role: 'VIEWER',
      aiModel: 'gpt-4o-mini'
    });
  }

  public async findUserByEmail(email: string): Promise<ITenantUserRecord | null> {
    try {
      const [rows] = await this.mariadbPool.query<RowDataPacket[]>(
        `SELECT id, tenant_id, email, password_hash, role, is_active 
         FROM tenant_users 
         WHERE UPPER(email) = UPPER(?) AND is_active = 1 LIMIT 1`,
        [email.trim()]
      );

      const row = rows[0];
      if (!row) return null;

      return {
        id: row.id as string,
        tenantId: row.tenant_id as string,
        email: row.email as string,
        passwordHash: row.password_hash as string,
        role: row.role as ITenantUserRecord['role'],
        isActive: Boolean(row.is_active),
      };
    } catch {
      return null;
    }
  }

  public async saveTenantApiKey(config: ITenantApiKeyConfig): Promise<void> {
    const encryptedPayload = this.securityService.encryptSecret(config.plainApiKey);

    // Update in-memory fallback
    const existing = await this.getTenantConfig(config.tenantId);
    existing.openaiApiKey = config.plainApiKey;
    existing.aiModel = config.selectedModel;
    MySQLTenantRepository.inMemoryTenants.set(config.tenantId, existing);

    try {
      await this.mariadbPool.query(
        `INSERT INTO tenant_api_keys (tenant_id, provider, encrypted_api_key, iv_hex, auth_tag_hex, selected_model)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           provider = VALUES(provider),
           encrypted_api_key = VALUES(encrypted_api_key),
           iv_hex = VALUES(iv_hex),
           auth_tag_hex = VALUES(auth_tag_hex),
           selected_model = VALUES(selected_model)`,
        [
          config.tenantId,
          config.provider,
          encryptedPayload.encryptedDataHex,
          encryptedPayload.ivHex,
          encryptedPayload.authTagHex,
          config.selectedModel,
        ]
      );
    } catch (err: any) {
      logger.warn(`[MySQLTenantRepository] Key saved in memory fallback: ${err.message}`);
    }
  }

  public async getTenantApiKey(tenantId: string): Promise<ITenantApiKeyConfig | null> {
    try {
      const [rows] = await this.mariadbPool.query<RowDataPacket[]>(
        `SELECT provider, encrypted_api_key, iv_hex, auth_tag_hex, selected_model 
         FROM tenant_api_keys 
         WHERE tenant_id = ? LIMIT 1`,
        [tenantId]
      );

      const row = rows[0];
      if (!row) {
        // Fallback memory check
        const config = await this.getTenantConfig(tenantId);
        if (config.openaiApiKey) {
          return {
            tenantId,
            provider: 'OPENAI',
            plainApiKey: config.openaiApiKey,
            selectedModel: config.aiModel || 'gpt-4o-mini'
          };
        }
        return null;
      }

      const plainApiKey = this.securityService.decryptSecret(
        row.encrypted_api_key as string,
        row.iv_hex as string,
        row.auth_tag_hex as string
      );

      return {
        tenantId,
        provider: row.provider as ITenantApiKeyConfig['provider'],
        plainApiKey,
        selectedModel: row.selected_model as string,
      };
    } catch {
      // Fallback memory check
      const config = await this.getTenantConfig(tenantId);
      if (config.openaiApiKey) {
        return {
          tenantId,
          provider: 'OPENAI',
          plainApiKey: config.openaiApiKey,
          selectedModel: config.aiModel || 'gpt-4o-mini'
        };
      }
      return null;
    }
  }

  public async saveTenantDocument(
    tenantId: string,
    chatType: 'FULL_JS' | 'HYBRID' | 'FULL_AI',
    fileName: string,
    fileType: 'PDF' | 'TXT' | 'JSON' | 'CSV' | 'XLSX',
    rawContent: string,
    parsedTreeJson: string
  ): Promise<string> {
    const documentId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    MySQLTenantRepository.inMemoryDocuments.set(tenantId, rawContent);
    MySQLTenantRepository.inMemoryParsedTrees.set(`${tenantId}:${chatType}`, parsedTreeJson);

    try {
      await this.mariadbPool.query(
        `INSERT INTO tenant_documents (id, tenant_id, chat_type, file_name, file_type, raw_content, parsed_tree_json)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [documentId, tenantId, chatType, fileName, fileType, rawContent, parsedTreeJson]
      );
    } catch (err: any) {
      logger.debug(`[MySQLTenantRepository] Doc saved in memory fallback: ${err.message}`);
    }

    return documentId;
  }

  public async getTenantDocumentTree(tenantId: string, chatType: 'FULL_JS' | 'HYBRID' | 'FULL_AI'): Promise<string | null> {
    const key = `${tenantId}:${chatType}`;
    const cached = MySQLTenantRepository.inMemoryParsedTrees.get(key);
    if (cached) return cached;

    try {
      const [rows] = await this.mariadbPool.query<RowDataPacket[]>(
        `SELECT parsed_tree_json FROM tenant_documents 
         WHERE tenant_id = ? AND chat_type = ? 
         ORDER BY created_at DESC LIMIT 1`,
        [tenantId, chatType]
      );
      if (rows && rows[0]) {
        const json = rows[0].parsed_tree_json;
        if (json) {
          MySQLTenantRepository.inMemoryParsedTrees.set(key, json);
          return json;
        }
      }
    } catch (err: any) {
      logger.debug(`[MySQLTenantRepository] Document tree DB fetch skipped: ${err.message}`);
    }

    return null;
  }

  // Extra helper methods for core engines
  public async getConversationSummary(tenantId: string, userPhone: string): Promise<string> {
    const key = `${tenantId}:${userPhone}`;
    return MySQLTenantRepository.inMemorySummaries.get(key) || '';
  }

  public async saveConversationSummary(tenantId: string, userPhone: string, summary: string): Promise<void> {
    const key = `${tenantId}:${userPhone}`;
    MySQLTenantRepository.inMemorySummaries.set(key, summary);
  }

  public async getBaselineDocumentText(tenantId: string): Promise<string> {
    return MySQLTenantRepository.inMemoryDocuments.get(tenantId) || 'Reglas estándar de servicio logístico y cotización de fletes.';
  }

  public async saveBaselineDocumentText(tenantId: string, text: string): Promise<void> {
    MySQLTenantRepository.inMemoryDocuments.set(tenantId, text);
  }

  public async getTenantConfig(tenantId: string): Promise<ITenantConfig> {
    const cached = MySQLTenantRepository.inMemoryTenants.get(tenantId);
    if (cached) return cached;

    try {
      const [rows] = await this.mariadbPool.query<any[]>(
        'SELECT tenant_id, nombre, rol, api_key_cifrada, modelo_ia FROM tenants WHERE tenant_id = ? LIMIT 1',
        [tenantId]
      );
      if (rows && rows.length > 0) {
        const row = rows[0];
        const config: ITenantConfig = {
          tenantId: row.tenant_id,
          name: row.nombre,
          role: row.rol || 'VIEWER',
          openaiApiKey: row.api_key_cifrada ? this.securityService.decryptSecret(row.api_key_cifrada, row.iv_hex, row.auth_tag_hex) : undefined,
          aiModel: row.modelo_ia || 'gpt-4o-mini'
        };
        MySQLTenantRepository.inMemoryTenants.set(tenantId, config);
        return config;
      }
    } catch (err: any) {
      logger.debug(`[MySQLTenantRepository] DB query skipped: ${err.message}`);
    }

    return {
      tenantId,
      name: `Tenant ${tenantId}`,
      role: 'VIEWER',
      aiModel: 'gpt-4o-mini'
    };
  }

  public async getTenantRawDocument(tenantId: string, chatType: 'FULL_JS' | 'HYBRID' | 'FULL_AI'): Promise<string | null> {
    try {
      const [rows] = await this.mariadbPool.query<RowDataPacket[]>(
        `SELECT raw_content FROM tenant_documents 
         WHERE tenant_id = ? AND chat_type = ? 
         ORDER BY created_at DESC LIMIT 1`,
        [tenantId, chatType]
      );
      if (rows && rows[0]) {
        return rows[0].raw_content || null;
      }
    } catch (err: any) {
      logger.debug(`[MySQLTenantRepository] raw_content DB fetch skipped: ${err.message}`);
    }

    return this.getBaselineDocumentText(tenantId);
  }
}
