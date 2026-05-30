/**
 * @file usePushNotifications.ts
 * @description Hook para gestionar las notificaciones nativas del sistema operativo.
 */

import { useCallback, useEffect } from 'react';

export const usePushNotifications = () => {
  
  /**
   * Solicita permisos al usuario si aún no han sido otorgados.
   */
  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      console.warn("Este navegador no soporta notificaciones de escritorio.");
      return false;
    }

    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }

    return Notification.permission === "granted";
  }, []);

  /**
   * Dispara una notificación física.
   */
  const sendNotification = useCallback((title: string, body: string, icon?: string) => {
    // Solo notificar si la pestaña NO está visible para evitar redundancia
    if (document.visibilityState === 'visible') return;

    if (Notification.permission === "granted") {
      const n = new Notification(title, {
        body,
        icon: icon || '/logo-whatsapp-pro.png', // Icono de la App
        badge: '/badge-icon.png',
        tag: 'human-intervention', // Agrupa notificaciones similares
        silent: false // Permite que el sistema operativo emita sonido
      });

      n.onclick = () => {
        window.focus();
        n.close();
      };
    }
  }, []);

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  return { sendNotification };
};
