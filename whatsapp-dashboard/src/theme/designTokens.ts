/**
 * @file designTokens.ts
 * @description Sistema centralizado de tokens de diseño para garantizar consistencia visual
 * absoluta entre todos los chats, páneles de administración y widgets de la plataforma.
 */

export const DESIGN_TOKENS = {
  colors: {
    background: '#0b0c0d',
    surface: '#141517',
    surfaceElevated: '#1c1e21',
    surfaceBubbleBot: '#222428',
    surfaceBubbleUser: 'rgba(6, 78, 59, 0.5)',
    border: 'rgba(255, 255, 255, 0.1)',
    borderFocus: 'rgba(16, 185, 129, 0.4)',
    textPrimary: '#f4f4f5',
    textSecondary: '#a1a1aa',
    textMuted: '#71717a',
    
    // Identificadores por Motor Conversacional
    chat1Js: {
      primary: '#60a5fa',
      badgeBg: 'rgba(59, 130, 246, 0.1)',
      badgeBorder: 'rgba(59, 130, 246, 0.2)',
    },
    chat2Hybrid: {
      primary: '#fbbf24',
      badgeBg: 'rgba(245, 158, 11, 0.1)',
      badgeBorder: 'rgba(245, 158, 11, 0.2)',
    },
    chat3FullAi: {
      primary: '#c084fc',
      badgeBg: 'rgba(168, 85, 247, 0.1)',
      badgeBorder: 'rgba(168, 85, 247, 0.2)',
    },
  },
  borderRadius: {
    card: '1rem',      // rounded-2xl
    bubble: '1rem',    // rounded-2xl
    input: '0.75rem',  // rounded-xl
  },
  transitions: {
    default: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

export const WHATSAPP_TOKENS = {
  colors: {
    sidebarBackground: '#111b21',
    panelHeader: '#202c33',
    conversationBackground: '#0b141a',
    bubbleIncoming: '#202c33',
    bubbleOutgoing: '#005c4b',
    borderSubtle: 'rgba(255, 255, 255, 0.08)',
    textPrimary: '#e9edef',
    textSecondary: '#8696a0',
    accentGreen: '#00a884',
    engineJs: '#60a5fa',
    engineHybrid: '#fbbf24',
    engineAi: '#c084fc',
    engineQuad: '#10b981',
  },
} as const;
