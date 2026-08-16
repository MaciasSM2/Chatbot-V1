/**
 * @file UserPermission.ts
 * @description Definición de Roles, Permisos y Contexto de Autorización.
 * Sigue el principio de encapsulamiento para evitar hardcoding de permisos.
 */

export enum UserRole {
  DEVELOPER = 'DEVELOPER',
  USER_FULL_JS = 'USER_FULL_JS',
  USER_HYBRID = 'USER_HYBRID',
  USER_FULL_AI = 'USER_FULL_AI',
}

export enum Permission {
  ACCESS_FULL_JS_ENGINE = 'ACCESS_FULL_JS_ENGINE',
  ACCESS_HYBRID_ENGINE = 'ACCESS_HYBRID_ENGINE',
  ACCESS_FULL_AI_ENGINE = 'ACCESS_FULL_AI_ENGINE',
  ACCESS_SIMULTANEOUS_QUAD_CHAT = 'ACCESS_SIMULTANEOUS_QUAD_CHAT',
  MANAGE_USER_PERMISSIONS = 'MANAGE_USER_PERMISSIONS',
  MANAGE_SYSTEM_MODULES = 'MANAGE_SYSTEM_MODULES',
}

export interface IUserAuthContext {
  readonly userId: string;
  readonly tenantId: string;
  readonly email: string;
  readonly role: UserRole;
  readonly grantedPermissions: readonly Permission[];
}

/**
 * Matriz estática de permisos por defecto según el rol del usuario.
 */
export const DEFAULT_ROLE_PERMISSIONS: Readonly<Record<UserRole, readonly Permission[]>> = {
  [UserRole.DEVELOPER]: [
    Permission.ACCESS_FULL_JS_ENGINE,
    Permission.ACCESS_HYBRID_ENGINE,
    Permission.ACCESS_FULL_AI_ENGINE,
    Permission.ACCESS_SIMULTANEOUS_QUAD_CHAT,
    Permission.MANAGE_USER_PERMISSIONS,
    Permission.MANAGE_SYSTEM_MODULES,
  ],
  [UserRole.USER_FULL_JS]: [
    Permission.ACCESS_FULL_JS_ENGINE,
  ],
  [UserRole.USER_HYBRID]: [
    Permission.ACCESS_HYBRID_ENGINE,
  ],
  [UserRole.USER_FULL_AI]: [
    Permission.ACCESS_FULL_AI_ENGINE,
  ],
};
