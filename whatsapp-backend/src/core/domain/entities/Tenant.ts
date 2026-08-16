/**
 * @file Tenant.ts
 * @description Entidad de dominio Tenant.
 */

export class Tenant {
  constructor(
    public readonly id: string,
    public readonly companyName: string,
    public readonly isActive: boolean = true,
    public readonly createdAt?: Date
  ) {}
}
