import { v4 as uuidv4 } from "uuid";
import logger from "../../infrastructure/logging/Logger";

export interface SystemModule {
  id: string;
  name: string;
  is_enabled: boolean;
  updated_at?: Date;
}

export interface AuditLog {
  id: string;
  module_id: string;
  module_name: string;
  action: 'ACTIVATED' | 'DEACTIVATED';
  admin_name: string;
  previous_state: boolean;
  new_state: boolean;
  created_at: Date;
}

export class ModuleSettingsService {
  private inMemoryFallback: Map<string, SystemModule> = new Map([
    ['dashboard_home', { id: 'dashboard_home', name: 'Área de Inicio (Gráficas)', is_enabled: true }],
    ['module_clients', { id: 'module_clients', name: 'Gestión de Clientes', is_enabled: true }],
    ['module_greetings', { id: 'module_greetings', name: 'Motor de Saludos Dinámicos', is_enabled: true }]
  ]);

  constructor(private readonly dbPool?: any) {}

  /**
   * Verifica si un módulo específico está activo.
   */
  public async isEnabled(id: string): Promise<boolean> {
    if (this.dbPool) {
      try {
        const [rows]: any = await this.dbPool.query(
          "SELECT activo as is_enabled FROM modulos_sistema WHERE id = ?",
          [id]
        );
        if (rows.length > 0) {
          return !!rows[0].is_enabled;
        }
      } catch (err) {
        logger.warn(`[ModuleSettingsService] Falló lectura de DB para modulo ${id}, usando fallback en memoria`, { 
          error: err instanceof Error ? err.message : String(err) 
        });
      }
    }

    const fallback = this.inMemoryFallback.get(id);
    return fallback ? fallback.is_enabled : true;
  }

  /**
   * Obtiene la lista de todos los módulos registrados.
   */
  public async getModules(): Promise<SystemModule[]> {
    if (this.dbPool) {
      try {
        const [rows]: any = await this.dbPool.query(
          "SELECT id, nombre as name, activo as is_enabled, actualizado_en as updated_at FROM modulos_sistema ORDER BY id ASC"
        );
        if (rows.length > 0) {
          return rows.map((row: any) => ({
            id: row.id,
            name: row.name,
            is_enabled: !!row.is_enabled,
            updated_at: row.updated_at
          }));
        }
      } catch (err) {
        logger.warn(`[ModuleSettingsService] Falló getModules de DB, usando fallback en memoria`, { 
          error: err instanceof Error ? err.message : String(err) 
        });
      }
    }

    return Array.from(this.inMemoryFallback.values());
  }

  /**
   * Actualiza el estado habilitado/deshabilitado de un módulo con registro de auditoría atómico.
   */
  public async updateModule(id: string, isEnabled: boolean, adminName: string = "Sistema (Automático)", operatorId?: string, ipAddress?: string): Promise<SystemModule> {
    if (this.dbPool) {
      let client;
      try {
        client = await this.dbPool.getConnection();
        await client.query("START TRANSACTION");

        // 1. Obtener estado previo y nombre del módulo
        const [prevRes]: any = await client.query(
          "SELECT activo as is_enabled, nombre as name FROM modulos_sistema WHERE id = ? FOR UPDATE",
          [id]
        );
        
        let previousState = true;
        if (prevRes.length > 0) {
          previousState = !!prevRes[0].is_enabled;
        }

        // 2. Actualizar el estado del módulo
        await client.query(
          "UPDATE modulos_sistema SET activo = ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?",
          [isEnabled ? 1 : 0, id]
        );

        // Obtener el módulo actualizado ya que MySQL no soporta RETURNING
        const [res]: any = await client.query(
          "SELECT id, nombre as name, activo as is_enabled, actualizado_en as updated_at FROM modulos_sistema WHERE id = ?",
          [id]
        );

        if (res.length === 0) {
          throw new Error(`Failed to update module ${id}`);
        }

        // 3. Generar el Log de Auditoría — columnas alineadas con setup-db.ts
        const action = isEnabled ? 'ACTIVATED' : 'DEACTIVATED';
        const auditId = uuidv4();
        const deltaDiff = JSON.stringify({ before: { enabled: previousState }, after: { enabled: isEnabled } });
        await client.query(
          `INSERT INTO registros_auditoria (id, operator_id, action_type, affected_module, ip_address, delta_diff, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [auditId, operatorId || adminName, `TOGGLE_MODULE:${action}`, id, ipAddress || '127.0.0.1', deltaDiff]
        );

        await client.query("COMMIT");
        client.release();

        logger.info(`📝 AUDITORÍA: El módulo ${id} fue ${action} por ${adminName}`);

        const row = res[0];
        const updated: SystemModule = {
          id: row.id,
          name: row.name,
          is_enabled: !!row.is_enabled,
          updated_at: row.updated_at
        };
        this.inMemoryFallback.set(id, updated);
        return updated;
      } catch (err) {
        if (client) {
          await client.query("ROLLBACK").catch(() => {});
          client.release();
        }
        logger.error(`[ModuleSettingsService] Falló actualización atómica en DB para módulo ${id}, usando fallback en memoria`, { 
          error: err instanceof Error ? err.message : String(err) 
        });
      }
    }

    // Fallback en memoria (demo/tests sin postgres)
    const fallback = this.inMemoryFallback.get(id);
    if (fallback) {
      fallback.is_enabled = isEnabled;
      fallback.updated_at = new Date();
      this.inMemoryFallback.set(id, fallback);
      return fallback;
    } else {
      const newMod = { id, name: id, is_enabled: isEnabled, updated_at: new Date() };
      this.inMemoryFallback.set(id, newMod);
      return newMod;
    }
  }

  /**
   * Obtiene los últimos 50 registros de auditoría con JOIN para traer el nombre del módulo.
   */
  public async getAuditLogs(): Promise<AuditLog[]> {
    if (this.dbPool) {
      try {
        const [rows]: any = await this.dbPool.query(`
          SELECT 
            al.id, 
            al.affected_module as module_id, 
            COALESCE(sm.nombre, al.affected_module) as module_name, 
            al.action_type as action, 
            al.operator_id as admin_name, 
            JSON_EXTRACT(al.delta_diff, '$.before.enabled') as previous_state, 
            JSON_EXTRACT(al.delta_diff, '$.after.enabled') as new_state, 
            al.created_at 
          FROM registros_auditoria al
          LEFT JOIN modulos_sistema sm ON al.affected_module = sm.id
          ORDER BY al.created_at DESC
          LIMIT 50
        `);
        return rows.map((row: any) => ({
          id: row.id,
          module_id: row.module_id,
          module_name: row.module_name || row.module_id,
          action: typeof row.action === 'string' ? row.action.replace(/^TOGGLE_MODULE:/, '') : row.action,
          admin_name: row.admin_name,
          previous_state: row.previous_state === 1 || row.previous_state === true || row.previous_state === 'true',
          new_state: row.new_state === 1 || row.new_state === true || row.new_state === 'true',
          created_at: row.created_at
        }));
      } catch (err) {
        logger.error(`[ModuleSettingsService] Falló lectura de audit_logs de DB`, { 
          error: err instanceof Error ? err.message : String(err) 
        });
        return [];
      }
    }
    return [];
  }
}
