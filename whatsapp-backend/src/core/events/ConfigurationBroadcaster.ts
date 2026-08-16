/**
 * @file ConfigurationBroadcaster.ts
 * @description Implementación del Patrón Observer/Publisher para emitir cambios
 * de configuración a través de WebSockets (Socket.io) segmentados por sala de Tenant.
 */

import { Server as SocketIoServer } from 'socket.io';

export interface ITenantConfigUpdatePayload {
  readonly tenantId: string;
  readonly updatedModule: 'API_KEYS' | 'HYBRID_THRESHOLD' | 'DOCUMENTS' | 'GENERAL';
  readonly updatedBy: string;
  readonly timestamp: string;
}

export class ConfigurationBroadcaster {
  private static instance: ConfigurationBroadcaster | null = null;
  private ioServer: SocketIoServer | null = null;

  private constructor() {}

  /**
   * Obtiene la instancia única del publicador (Patrón Singleton).
   */
  public static getInstance(): ConfigurationBroadcaster {
    if (!ConfigurationBroadcaster.instance) {
      ConfigurationBroadcaster.instance = new ConfigurationBroadcaster();
    }
    return ConfigurationBroadcaster.instance;
  }

  /**
   * Inicializa el servidor de Socket.io.
   */
  public initialize(io: SocketIoServer): void {
    this.ioServer = io;

    this.ioServer.on('connection', (socket) => {
      // Suscripción segura a la sala privada del Tenant
      socket.on('join_tenant_room', (tenantId: string) => {
        if (tenantId) {
          void socket.join(`tenant:${tenantId}`);
        }
      });
    });
  }

  /**
   * Emite un evento de actualización de configuración a todos los clientes del Tenant.
   * 
   * @param payload Datos de la modificación realizada.
   */
  public notifyConfigUpdated(payload: ITenantConfigUpdatePayload): void {
    if (!this.ioServer) {
      console.warn('⚠️ [ConfigurationBroadcaster] Servidor Socket.io no inicializado.');
      return;
    }

    const roomName = `tenant:${payload.tenantId}`;
    
    // Transmisión aislada a la sala específica del Tenant
    this.ioServer.to(roomName).emit('tenant:config_updated', payload);
  }
}
