/**
 * @file AuditLogService.ts
 * @description Central de trazabilidad inmutable. 
 * Escribe registros históricos de control operacional en formato JSON sobre MariaDB.
 */
import { Pool } from 'mysql2/promise';
import logger from '../../infrastructure/logging/Logger';

interface AuditPayload {
  operatorId: string;
  actionType: 'UPDATE_THEME' | 'TOGGLE_MODULE' | 'MUTATE_HOURS' | 'FORCE_TIME_WARP';
  affectedModule: string;
  ipAddress: string;
  previousState: Record<string, any>;
  newState: Record<string, any>;
}

export class AuditLogService {
  constructor(private readonly mariadbPool: Pool) {}

  /**
   * Inserta un registro inmutable de auditoría bajo control estricto de hilos de datos.
   */
  public async writeLog(payload: AuditPayload): Promise<void> {
    const logId = `AUDIT-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    // Serializar de forma explícita las estructuras diferenciales a cadenas JSON limpias
    const deltaDiffBlob = JSON.stringify({
      before: payload.previousState,
      after: payload.newState
    });

    try {
      await this.mariadbPool.query(
        `INSERT INTO registros_auditoria 
          (id, operator_id, action_type, affected_module, ip_address, delta_diff, created_at)
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          logId,
          payload.operatorId,
          payload.actionType,
          payload.affectedModule,
          payload.ipAddress,
          deltaDiffBlob
        ]
      );
      
      logger.info(`📝 [Audit System] Log consolidado con éxito. ID: ${logId} | Operación: ${payload.actionType}`);
    } catch (auditError: any) {
      // Un fallo en el sistema de auditoría no debe congelar la operación del usuario, pero sí alertar con severidad
      logger.error(`🚨 [Audit Critical Error] No se pudo escribir la bitácora inmutable en MariaDB: ${auditError.message}`);
    }
  }
}
