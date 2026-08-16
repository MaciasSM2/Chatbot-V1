/**
 * @file TenantUser.ts
 * @description Entidad de dominio TenantUser para usuarios con roles RBAC.
 */

import { UserRole } from '../../../interfaces/http/middlewares/RoleGuardMiddleware';

export class TenantUser {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly role: UserRole,
    public readonly isActive: boolean = true,
    public readonly createdAt?: Date
  ) {}
}
