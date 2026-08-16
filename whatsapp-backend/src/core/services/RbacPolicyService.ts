/**
 * @file RbacPolicyService.ts
 * @description Servicio encargado de evaluar las políticas de acceso (SOLID - Single Responsibility).
 * Evita la colisión de perfiles y garantiza que ningún usuario consulte motores no autorizados.
 */

import { IUserAuthContext, Permission, UserRole } from '../domain/entities/UserPermission';

export class RbacPolicyService {
  /**
   * Evalúa si un contexto de usuario posee un permiso específico.
   */
  public hasPermission(context: IUserAuthContext, requiredPermission: Permission): boolean {
    if (context.role === UserRole.DEVELOPER) {
      return true; // El Desarrollador tiene acceso irrestricto
    }
    return context.grantedPermissions ? context.grantedPermissions.includes(requiredPermission) : false;
  }

  /**
   * Valida si el usuario tiene autorización para ejecutar el simulador simultáneo Quad-Chat.
   */
  public canExecuteSimultaneousChat(context: IUserAuthContext): boolean {
    return this.hasPermission(context, Permission.ACCESS_SIMULTANEOUS_QUAD_CHAT);
  }

  /**
   * Valida si el usuario puede consultar un motor de chat específico.
   */
  public canExecuteEngine(context: IUserAuthContext, engineType: 'FULL_JS' | 'HYBRID' | 'FULL_AI'): boolean {
    if (context.role === UserRole.DEVELOPER) {
      return true;
    }

    switch (engineType) {
      case 'FULL_JS':
        return this.hasPermission(context, Permission.ACCESS_FULL_JS_ENGINE);
      case 'HYBRID':
        return this.hasPermission(context, Permission.ACCESS_HYBRID_ENGINE);
      case 'FULL_AI':
        return this.hasPermission(context, Permission.ACCESS_FULL_AI_ENGINE);
      default:
        return false;
    }
  }
}
