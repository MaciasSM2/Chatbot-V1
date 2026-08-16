'use client';

import React, { useState } from 'react';
import { WhatsAppPanelLayout } from '../../components/layout/whatsapp/WhatsAppPanelLayout';
import { useAuthStore } from '../../application/store/useAuthStore';
import { UserRole } from '../../application/config/navigationConfig';
import { ShieldCheck, UserCheck, Cpu, Zap, Bot } from 'lucide-react';

/**
 * Punto de entrada para la vista de muestra del simulador en arquitectura de 3 paneles WhatsApp Desktop.
 * Garantiza aislamiento perimetral por Rol de Usuario (DEVELOPER, USER_FULL_JS, USER_HYBRID, USER_FULL_AI).
 */
export default function MuestraPage() {
  const { currentUser } = useAuthStore();
  const [activeRoleOverride, setActiveRoleOverride] = useState<UserRole | null>(null);

  // Rol activo efectivo (por defecto del usuario autenticado o del selector de pruebas)
  const effectiveRole: UserRole = activeRoleOverride || (currentUser?.role as UserRole) || 'DEVELOPER';

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-[#0b141a]">
      {/* BARRA SUPERIOR DE PRUEBA Y CONMUTACIÓN DE ROLES RBAC */}
      <header className="bg-[#141517] border-b border-white/10 px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 shrink-0 z-30 select-none">
        <div className="flex items-center gap-2 text-xs">
          <ShieldCheck size={16} className="text-[#00a884]" />
          <span className="font-bold text-white uppercase tracking-wider text-[11px]">
            Simulador de Aislamiento por Perfil RBAC:
          </span>
          <span className="bg-[#202c33] text-[#00a884] font-mono px-2 py-0.5 rounded border border-white/10 text-[10px] font-bold">
            {effectiveRole}
          </span>
        </div>

        {/* CONTROLES PARA SIMULAR CADA PERFIL DE USUARIO INDIVIDUAL */}
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="text-zinc-400 text-[10px] hidden sm:inline">Simular Perfil:</span>
          
          <button
            onClick={() => setActiveRoleOverride('DEVELOPER')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer text-[10px] ${
              effectiveRole === 'DEVELOPER'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-[#202c33] text-zinc-400 hover:text-white'
            }`}
            title="Acceso total a los 4 chats y paneles administrativos"
          >
            <UserCheck size={12} /> Desarrollador (4 Chats)
          </button>

          <button
            onClick={() => setActiveRoleOverride('USER_FULL_JS')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer text-[10px] ${
              effectiveRole === 'USER_FULL_JS'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-[#202c33] text-zinc-400 hover:text-white'
            }`}
            title="Módulo aislado únicamente para Chat 1: Full JS"
          >
            <Cpu size={12} /> Usuario Full JS
          </button>

          <button
            onClick={() => setActiveRoleOverride('USER_HYBRID')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer text-[10px] ${
              effectiveRole === 'USER_HYBRID'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-[#202c33] text-zinc-400 hover:text-white'
            }`}
            title="Módulo aislado únicamente para Chat 2: Híbrido"
          >
            <Zap size={12} /> Usuario Híbrido
          </button>

          <button
            onClick={() => setActiveRoleOverride('USER_FULL_AI')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer text-[10px] ${
              effectiveRole === 'USER_FULL_AI'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-[#202c33] text-zinc-400 hover:text-white'
            }`}
            title="Módulo aislado únicamente para Chat 3: Full IA"
          >
            <Bot size={12} /> Usuario Full IA
          </button>
        </div>
      </header>

      {/* RENDERIZADO DEL PANEL TRIPLE CON EL ROL SELECCIONADO */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <WhatsAppPanelLayout userRole={effectiveRole} />
      </div>
    </div>
  );
}
