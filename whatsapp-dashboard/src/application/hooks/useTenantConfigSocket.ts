/**
 * @file useTenantConfigSocket.ts
 * @description Hook de React que conecta el cliente al canal WebSocket Socket.io del Tenant.
 * Reacciona instantáneamente a cambios de configuración guardados en el backend.
 */

import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useTenantStore } from '../store/useTenantStore';

let socket: Socket | null = null;

export function useTenantConfigSocket(tenantId: string) {
  const reloadConfigFromApi = useTenantStore((state) => state.reloadConfigFromApi);

  useEffect(() => {
    if (!tenantId) return;

    // Instanciar Socket.io singleton
    if (!socket) {
      socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || '/', {
        transports: ['websocket'],
      });
    }

    // Unirse a la sala privada del Tenant
    socket.emit('join_tenant_room', tenantId);

    // Escuchar el evento de actualización de configuración emitido por el backend
    const handleConfigUpdated = (payload: { updatedModule: string; updatedBy: string }) => {
      console.log(`⚡ [Realtime Config Sync]: Módulo [${payload.updatedModule}] actualizado por ${payload.updatedBy}`);
      
      // Re-sincronizar automáticamente el estado global sin recargar la página
      void reloadConfigFromApi(tenantId);
    };

    socket.on('tenant:config_updated', handleConfigUpdated);

    return () => {
      if (socket) {
        socket.off('tenant:config_updated', handleConfigUpdated);
      }
    };
  }, [tenantId, reloadConfigFromApi]);
}
