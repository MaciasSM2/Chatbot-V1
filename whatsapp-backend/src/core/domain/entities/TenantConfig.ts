/**
 * @file TenantConfig.ts
 * @description Entidad de dominio que representa la configuración de un Inquilino (Tenant).
 */

import { UserRole } from '../../../interfaces/http/middlewares/RoleGuardMiddleware';

export class TenantConfig {
  public readonly tenantId: string;
  public readonly name: string;
  public readonly role: UserRole;
  public readonly encryptedApiKey: string | undefined;
  public readonly aiModel: string;

  constructor(data: {
    tenantId: string;
    name: string;
    role: UserRole;
    encryptedApiKey?: string;
    aiModel?: string;
  }) {
    this.tenantId = data.tenantId;
    this.name = data.name;
    this.role = data.role;
    this.encryptedApiKey = data.encryptedApiKey;
    this.aiModel = data.aiModel || 'gpt-4o-mini';
  }
}
