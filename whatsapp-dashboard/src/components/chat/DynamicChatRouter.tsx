'use client';

import React, { useState } from 'react';
import { ShieldAlert, Cpu, Zap, Bot, LayoutGrid, Users } from 'lucide-react';
import { useAuthStore } from '../../application/store/useAuthStore';
import { QuadChatContainer } from './QuadChatContainer';
import { SingleBotChatWindow } from './SingleBotChatWindow';
import { AdminUserPermissionManager } from './AdminUserPermissionManager';

/**
 * Componente principal que renderiza de forma aislada la interfaz según el rol del usuario.
 * Evita la colisión de módulos e impide que un usuario estándar acceda al Quad-Chat o a otros motores.
 */
export function DynamicChatRouter() {
  const { currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'SIMULTANEOUS' | 'SINGLE' | 'PERMISSIONS'>('SIMULTANEOUS');

  if (!currentUser) {
    return (
      <div className="h-screen bg-[#0b0c0d] flex items-center justify-center text-zinc-400 text-xs font-mono">
        <ShieldAlert size={20} className="text-red-400 mr-2" />
        Inicia sesión para acceder al módulo de chat correspondiente a tu perfil.
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // VISTA PARA EL PERFIL DESARROLLADOR (ACCESO TOTAL)
  // ─────────────────────────────────────────────────────────────
  if (currentUser.role === 'DEVELOPER') {
    return (
      <div className="flex flex-col h-screen w-full bg-[#0b0c0d] text-white">
        {/* BARRA SUPERIOR DE CONTROL PARA DESARROLLADOR */}
        <header className="bg-[#141517] border-b border-white/10 px-6 py-2.5 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-emerald-400 uppercase tracking-wider">Perfil Desarrollador</span>
            <span className="text-zinc-500">|</span>
            <span className="text-zinc-400">Acceso Ilimitado a los 4 Chats y Gestión de Módulos</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('SIMULTANEOUS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'SIMULTANEOUS' ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              <LayoutGrid size={14} /> Cuarto Chat (Simultáneo)
            </button>
            <button
              onClick={() => setActiveTab('SINGLE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'SINGLE' ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              <Bot size={14} /> Vista WhatsApp Individual
            </button>
            <button
              onClick={() => setActiveTab('PERMISSIONS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'PERMISSIONS' ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              <Users size={14} /> Asignación de Permisos
            </button>
          </div>
        </header>

        {/* CONTENIDO SEGÚN LA TAB SELECCIONADA POR EL DESARROLLADOR */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'SIMULTANEOUS' && <QuadChatContainer tenantId="tenant-demo-01" />}
          {activeTab === 'SINGLE' && (
            <div className="p-6 h-full">
              <SingleBotChatWindow
                botType="JS"
                title="Chat 1 — Motor FSM JS (Rule-Based)"
                subtitle="Sin IA. Respuestas 100% deterministas basadas en reglas."
                badgeLabel="FSM JS (0 Tokens)"
                badgeColorClass="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              />
            </div>
          )}
          {activeTab === 'PERMISSIONS' && <AdminUserPermissionManager />}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // VISTAS AISLADAS PARA USUARIOS ESTÁNDAR (UN SOLO MOTOR)
  // ─────────────────────────────────────────────────────────────
  const userEngine = currentUser.role === 'USER_HYBRID' ? 'HYBRID' : currentUser.role === 'USER_FULL_AI' ? 'FULL_AI' : 'JS';

  return (
    <div className="flex flex-col h-screen w-full bg-[#0b0c0d]">
      <header className="bg-[#141517] border-b border-white/10 px-6 py-2.5 flex items-center justify-between text-xs text-white shrink-0">
        <div className="flex items-center gap-2">
          {currentUser.role === 'USER_FULL_JS' && <Cpu size={16} className="text-blue-400" />}
          {currentUser.role === 'USER_HYBRID' && <Zap size={16} className="text-amber-400" />}
          {currentUser.role === 'USER_FULL_AI' && <Bot size={16} className="text-purple-400" />}
          <span className="font-bold uppercase tracking-wider">
            {currentUser.role === 'USER_FULL_JS' && 'Módulo Exclusivo Chat 1: Full JS'}
            {currentUser.role === 'USER_HYBRID' && 'Módulo Exclusivo Chat 2: Híbrido'}
            {currentUser.role === 'USER_FULL_AI' && 'Módulo Exclusivo Chat 3: Full IA'}
          </span>
        </div>
        <span className="text-zinc-500 text-[11px]">Usuario: {currentUser.email}</span>
      </header>

      <div className="flex-1 overflow-hidden p-6">
        <SingleBotChatWindow
          botType={userEngine}
          title={
            userEngine === 'JS'
              ? 'Chat 1 — Motor FSM JS (Rule-Based)'
              : userEngine === 'HYBRID'
              ? 'Chat 2 — Motor Híbrido (JS + IA On-Demand)'
              : 'Chat 3 — Full IA Generativa (RAG + Caveman)'
          }
          subtitle={
            userEngine === 'JS'
              ? 'Sin IA. Respuestas 100% deterministas.'
              : userEngine === 'HYBRID'
              ? 'Reglas locales + invocación de LLM si se supera el umbral heurístico.'
              : 'Atención continua respaldada por documentos corporativos.'
          }
          badgeLabel={userEngine === 'JS' ? 'FSM JS' : userEngine === 'HYBRID' ? 'HÍBRIDO' : 'FULL IA'}
          badgeColorClass={
            userEngine === 'JS'
              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
              : userEngine === 'HYBRID'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
          }
        />
      </div>
    </div>
  );
}
