'use client';

import React from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { TopBar } from '../../components/ThemeSwitcher';
import { useClientAuthCheck } from '../../application/hooks/useClientAuthCheck';
import { useSocketStore } from '../../application/store/useSocketStore';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthVerified, operatorContext } = useClientAuthCheck();

  React.useEffect(() => {
    if (isAuthVerified && operatorContext) {
      useSocketStore.getState().establishLiveConnection(operatorContext.email);
    }
    return () => {
      useSocketStore.getState().terminateLiveConnection();
    };
  }, [isAuthVerified, operatorContext]);

  if (!isAuthVerified) {
    return (
      <div className="min-h-screen bg-[#0b0c0d] flex items-center justify-center font-mono text-[11px] text-[var(--theme-accent)] tracking-widest">
        &gt; VERIFICANDO AUTENTICACION PERIMETRAL DEL TURNO...
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background-main text-text-main transition-colors duration-300">
      <Sidebar operatorRole={operatorContext?.role || 'OPERATOR'} />
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        <TopBar operatorEmail={operatorContext?.email || ''} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background-subtle p-6 animate-in fade-in duration-200">
          {children}
        </main>
      </div>
    </div>
  );
}
