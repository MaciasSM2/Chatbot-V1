/**
 * @file ITenantRepository.ts
 * @description Contrato abstracto para la gestión de datos Multi-Tenant.
 */

export interface ITenantApiKeyConfig {
  tenantId: string;
  provider: 'OPENAI' | 'GEMINI' | 'ANTHROPIC';
  plainApiKey: string;
  selectedModel: string;
}

export interface ITenantUserRecord {
  id: string;
  tenantId: string;
  email: string;
  passwordHash: string;
  role: 'ROLE_PRESENTACION' | 'SUPER_ADMIN_A' | 'SUPER_ADMIN_B' | 'SUPER_ADMIN_C';
  isActive: boolean;
}

export interface ITenantRepository {
  findUserByEmail(email: string): Promise<ITenantUserRecord | null>;
  saveTenantApiKey(config: ITenantApiKeyConfig): Promise<void>;
  getTenantApiKey(tenantId: string): Promise<ITenantApiKeyConfig | null>;
  saveTenantDocument(
    tenantId: string,
    chatType: 'FULL_JS' | 'HYBRID' | 'FULL_AI',
    fileName: string,
    fileType: 'PDF' | 'TXT' | 'JSON' | 'CSV' | 'XLSX',
    rawContent: string,
    parsedTreeJson: string
  ): Promise<string>;
  getTenantDocumentTree(tenantId: string, chatType: 'FULL_JS' | 'HYBRID' | 'FULL_AI'): Promise<string | null>;
  getTenantRawDocument(tenantId: string, chatType: 'FULL_JS' | 'HYBRID' | 'FULL_AI'): Promise<string | null>;
  getConversationSummary(tenantId: string, userPhone: string): Promise<string>;
  saveConversationSummary(tenantId: string, userPhone: string, summary: string): Promise<void>;
}
