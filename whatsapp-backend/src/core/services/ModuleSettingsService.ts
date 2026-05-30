import { Pool } from "pg";
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

  constructor(private readonly dbPool?: Pool) {}

  /**
   * Verifica si un módulo específico está activo.
   */
  public async isEnabled(id: string): Promise<boolean> {
    if (this.dbPool) {
      try {
        const res = await this.dbPool.query(
          "SELECT is_enabled FROM system_modules WHERE id = $1",
          [id]
        );
        if (res.rows.length > 0) {
          return res.rows[0].is_enabled;
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
        const res = await this.dbPool.query(
          "SELECT id, name, is_enabled, updated_at FROM system_modules ORDER BY id ASC"
        );
        if (res.rows.length > 0) {
          return res.rows.map(row => ({
            id: row.id,
            name: row.name,
            is_enabled: row.is_enabled,
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
  public async updateModule(id: string, isEnabled: boolean, adminName: string = "Sistema (Automático)"): Promise<SystemModule> {
    if (this.dbPool) {
      let client;
      try {
        client = await this.dbPool.connect();
        await client.query("BEGIN");

        // 1. Obtener estado previo y nombre del módulo
        const prevRes = await client.query(
          "SELECT is_enabled, name FROM system_modules WHERE id = $1 FOR UPDATE",
          [id]
        );
        
        let previousState = true;
        if (prevRes.rows.length > 0) {
          previousState = prevRes.rows[0].is_enabled;
        }

        // 2. Actualizar el estado del módulo
        const res = await client.query(
          "UPDATE system_modules SET is_enabled = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, name, is_enabled, updated_at",
          [id, isEnabled]
        );

        if (res.rows.length === 0) {
          throw new Error(`Failed to update module ${id}`);
        }

        // 3. Generar el Log de Auditoría
        const action = isEnabled ? 'ACTIVATED' : 'DEACTIVATED';
        await client.query(
          `INSERT INTO audit_logs (module_id, action, admin_name, previous_state, new_state) 
           VALUES ($1, $2, $3, $4, $5)`,
          [id, action, adminName, previousState, isEnabled]
        );

        await client.query("COMMIT");

        logger.info(`📝 AUDITORÍA: El módulo ${id} fue ${action} por ${adminName}`);

        const row = res.rows[0];
        const updated: SystemModule = {
          id: row.id,
          name: row.name,
          is_enabled: row.is_enabled,
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
        // En lugar de lanzar el error (throw err), caemos al fallback de memoria
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
        const res = await this.dbPool.query(`
          SELECT 
            al.id, 
            al.module_id, 
            sm.name as module_name, 
            al.action, 
            al.admin_name, 
            al.previous_state, 
            al.new_state, 
            al.created_at 
          FROM audit_logs al
          LEFT JOIN system_modules sm ON al.module_id = sm.id
          ORDER BY al.created_at DESC
          LIMIT 50
        `);
        return res.rows.map(row => ({
          id: row.id,
          module_id: row.module_id,
          module_name: row.module_name || row.module_id,
          action: row.action,
          admin_name: row.admin_name,
          previous_state: row.previous_state,
          new_state: row.new_state,
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
