'use client';

import React from 'react';
import { RouteGuard } from '../../../components/auth/RouteGuard';
import { SingleBotChatWindow } from '../../../components/chat/SingleBotChatWindow';

export default function AdminCPage() {
  return (
    <RouteGuard allowedRoles={['USER_FULL_AI', 'DEVELOPER']}>
      <div className="p-6 bg-bg-main min-h-screen text-text-main space-y-6 transition-colors duration-300">
        <SingleBotChatWindow
          botType="FULL_AI"
          title="Chat 3 — Motor Full IA + RAG / Compresión"
          subtitle="Procesamiento 100% Inteligencia Artificial con optimizador de tokens y RAG documental."
          badgeLabel="Full IA (RAG Activo)"
          badgeColorClass="bg-purple-500/10 text-purple-400 border border-purple-500/20"
        />
      </div>
    </RouteGuard>
  );
}
