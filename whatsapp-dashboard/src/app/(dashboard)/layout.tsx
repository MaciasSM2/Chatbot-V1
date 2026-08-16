'use client';

import React from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { TopBar } from '../../components/ThemeSwitcher';

export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg-main text-text-main transition-colors duration-300">
      <Sidebar operatorRole="DEVELOPER" />
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        <TopBar operatorEmail="" />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-bg-main p-6 animate-in fade-in duration-200">
          {children}
        </main>
      </div>
    </div>
  );
}
