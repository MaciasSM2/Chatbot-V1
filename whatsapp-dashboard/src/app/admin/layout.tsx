'use client';

import React from 'react';
import { WhatsAppPanelLayout } from '../../components/layout/whatsapp/WhatsAppPanelLayout';

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
        <div className="min-h-screen bg-[#0b141a] flex flex-col items-center justify-center font-mono text-[11px] text-red-400 tracking-widest p-8">
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
      <WhatsAppPanelLayout userRole="DEVELOPER" />
    </ErrorBoundary>
  );
}
