'use client';

import React from 'react';
import { NavigationRail } from './NavigationRail';
import { ChatListPanel } from './ChatListPanel';
import { ChatConversationViewport } from './ChatConversationViewport';
import { AdminSubmenuPanel } from './AdminSubmenuPanel';
import { AdminViewport } from './AdminViewport';
import { useWhatsAppLayoutStore } from '../../../application/store/useWhatsAppLayoutStore';
import { UserRole } from '../../../application/config/navigationConfig';

export function WhatsAppPanelLayout({ userRole }: { readonly userRole: UserRole }) {
  const { activeModuleId } = useWhatsAppLayoutStore();

  const isChatsSection = activeModuleId === 'chats';

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#0b141a]">
      {/* PANEL 1: NAV RAIL (PERSISTENTE POR ÍCONOS Y ROLES RBAC) */}
      <NavigationRail userRole={userRole} />

      {/* PANEL 2: DINÁMICO SEGÚN LA SECCIÓN ACTIVA (LISTA DE CHATS O SUBMENÚ ADMINISTRATIVO) */}
      {isChatsSection ? (
        <ChatListPanel userRole={userRole} />
      ) : (
        <AdminSubmenuPanel />
      )}

      {/* PANEL 3: DINÁMICO SEGÚN LA SECCIÓN ACTIVA (VIEWPORT DE CONVERSACIÓN O VIEWPORT ADMINISTRATIVO) */}
      {isChatsSection ? (
        <ChatConversationViewport />
      ) : (
        <AdminViewport />
      )}
    </div>
  );
}
