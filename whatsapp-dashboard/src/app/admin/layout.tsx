'use client';

import React from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { TopBar } from '../../components/ThemeSwitcher';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0b0c0d] flex flex-col items-center justify-center font-mono text-[11px] text-red-400 tracking-widest p-8">
          <div className="text-lg mb-4">&gt; CRASH RECOVERY</div>
          <pre className="text-red-300/60 max-w-xl text-center">{this.state.error?.message}</pre>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-6 px-4 py-2 border border-red-400/30 rounded-lg hover:bg-red-950/20 transition-colors"
          >
            RETRY
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <div className="flex h-screen w-screen overflow-hidden bg-background-main text-text-main transition-colors duration-300">
        <Sidebar operatorRole="OPERATOR" />
        <div className="flex flex-col flex-1 h-full overflow-hidden">
          <TopBar operatorEmail="" />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background-subtle p-6 animate-in fade-in duration-200">
            {children}
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}
