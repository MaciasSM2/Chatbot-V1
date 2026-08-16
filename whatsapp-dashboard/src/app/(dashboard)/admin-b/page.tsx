'use client';

import React from 'react';
import { RouteGuard } from '../../../components/auth/RouteGuard';
import { SingleBotChatWindow } from '../../../components/chat/SingleBotChatWindow';

export default function AdminBPage() {
  return (
    <RouteGuard allowedRoles={['USER_HYBRID', 'DEVELOPER']}>
      <div className="p-6 bg-bg-main min-h-screen text-text-main space-y-6 transition-colors duration-300">
        <SingleBotChatWindow
          botType="HYBRID"
          title="Chat 2 — Motor Híbrido (JS + IA Heurística)"
          subtitle="Atención básica por reglas JS; activa IA automáticamente ante preguntas complejas."
          badgeLabel="JS + IA (Doble Motor)"
          badgeColorClass="bg-amber-500/10 text-amber-400 border border-amber-500/20"
        />
      </div>
    </RouteGuard>
  );
}
