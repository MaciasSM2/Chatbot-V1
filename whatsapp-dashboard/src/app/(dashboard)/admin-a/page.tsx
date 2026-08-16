'use client';

import React from 'react';
import { RouteGuard } from '../../../components/auth/RouteGuard';
import { SingleBotChatWindow } from '../../../components/chat/SingleBotChatWindow';

export default function AdminAPage() {
  return (
    <RouteGuard allowedRoles={['USER_FULL_JS', 'DEVELOPER']}>
      <div className="p-6 bg-bg-main min-h-screen text-text-main space-y-6 transition-colors duration-300">
        <SingleBotChatWindow
          botType="JS"
          title="Chat 1 — Motor FSM JS (Rule-Based)"
          subtitle="Sin IA. Respuestas 100% deterministas basadas en reglas y documento de estructura."
          badgeLabel="FSM JS (0 Tokens)"
          badgeColorClass="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
        />
      </div>
    </RouteGuard>
  );
}
