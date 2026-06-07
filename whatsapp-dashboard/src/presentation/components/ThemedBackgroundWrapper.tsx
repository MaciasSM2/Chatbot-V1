'use client';

import React from 'react';

/**
 * @file ThemedBackgroundWrapper.tsx
 * @description Componente de infraestructura visual. Renderiza el Amanecer o la Noche Estrellada usando CSS Tokens.
 */
export function ThemedBackgroundWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div 
      className="relative w-full h-full overflow-hidden transition-all duration-500"
      style={{
        background: `radial-gradient(circle at bottom right, var(--theme-bg-gradient-end, #FFFFFF) 0%, var(--theme-bg-base, #F4F9F5) 100%)`
      }}
    >
      {/* CAPA DE ESTRELLAS INTERACTIVA (Exclusiva para la modalidad oscura) */}
      <div className="absolute inset-0 opacity-0 dark:opacity-40 pointer-events-none transition-opacity duration-500">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          {/* Matriz de micro-estrellas con brillos variables */}
          <circle cx="10%" cy="15%" r="1" fill="#FFFFFF" className="animate-pulse" style={{ animationDuration: '3s' }} />
          <circle cx="30%" cy="25%" r="1.5" fill="var(--theme-accent, #25D366)" className="animate-pulse" style={{ animationDuration: '2s' }} />
          <circle cx="55%" cy="12%" r="1" fill="#FFFFFF" />
          <circle cx="75%" cy="45%" r="2" fill="var(--theme-accent, #25D366)" className="animate-pulse" style={{ animationDuration: '4s' }} />
          <circle cx="90%" cy="20%" r="1" fill="#FFFFFF" style={{ animationDuration: '2.5s' }} />
          <circle cx="45%" cy="75%" r="1.2" fill="#FFFFFF" />
          <circle cx="20%" cy="85%" r="2" fill="var(--theme-accent, #25D366)" />
          <circle cx="80%" cy="80%" r="1" fill="#FFFFFF" />
        </svg>
      </div>

      {/* EFECTO AMANECER (Light Mode): Filtro difuminado perimetral en bordes */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[var(--theme-accent,#25D366)]/5 to-transparent dark:hidden pointer-events-none" />

      {/* Capa de Contenido Seguro */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}
