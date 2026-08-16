'use client';

import React from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  LayoutDashboard,
  MessageCircleCode,
  Users,
  Calendar,
  Settings,
  Receipt,
  Bot,
} from 'lucide-react';
import { NAV_MENU_ITEMS, UserRole } from '../../../application/config/navigationConfig';
import { useWhatsAppLayoutStore } from '../../../application/store/useWhatsAppLayoutStore';
import { WHATSAPP_TOKENS } from '../../../theme/designTokens';

const ICON_MAP = {
  MessageSquare,
  LayoutDashboard,
  MessageCircleCode,
  Users,
  Calendar,
  Settings,
  Receipt,
};

export function NavigationRail({ userRole }: { readonly userRole: UserRole }) {
  const { activeModuleId, setActiveModule } = useWhatsAppLayoutStore();

  // Filtrar los módulos visibles en el Panel 1 según el rol RBAC
  const visibleNavItems = NAV_MENU_ITEMS.filter((item) => item.allowedRoles.includes(userRole));

  return (
    <nav
      className="w-16 h-full flex flex-col items-center justify-between py-4 border-r shrink-0 z-20 select-none"
      style={{
        backgroundColor: WHATSAPP_TOKENS.colors.sidebarBackground,
        borderColor: WHATSAPP_TOKENS.colors.borderSubtle,
      }}
    >
      {/* ÍCONO SUPERIOR BRANDING WHATSAPP */}
      <div className="flex flex-col items-center gap-6">
        <div className="p-2.5 bg-[#00a884]/10 text-[#00a884] rounded-full">
          <Bot size={22} />
        </div>

        {/* LISTA DE MÓDULOS PERMITIDOS (PANEL 1) */}
        <div className="flex flex-col gap-3">
          {visibleNavItems.map((item) => {
            const IconComponent = ICON_MAP[item.iconName];
            const isActive = activeModuleId === item.id;

            return (
              <Link
                key={item.id}
                href={item.path}
                onClick={() => setActiveModule(item.id)}
                className={`p-3 rounded-xl transition-all relative group cursor-pointer flex items-center justify-center ${
                  isActive ? 'bg-white/10 text-[#00a884]' : 'text-[#8696a0] hover:bg-white/5 hover:text-white'
                }`}
                title={item.label}
              >
                <IconComponent size={20} />

                {/* INDICADOR DE ACTIVIDAD LATERAL */}
                {isActive && (
                  <span className="absolute left-0 w-1 h-6 bg-[#00a884] rounded-r-full" />
                )}

                {/* TOOLTIP EMERGENTE */}
                <span className="absolute left-16 bg-[#202c33] text-white text-[11px] font-medium px-2.5 py-1 rounded-md shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* AVATAR Y ROL EN PARTE INFERIOR */}
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] text-white border"
          style={{
            backgroundColor: userRole === 'DEVELOPER' ? '#10b981' : '#3b82f6',
            borderColor: WHATSAPP_TOKENS.colors.borderSubtle,
          }}
          title={`Rol activo: ${userRole}`}
        >
          {userRole.substring(0, 2)}
        </div>
      </div>
    </nav>
  );
}
