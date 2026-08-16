/**
 * @file LoadingOverlay.jsx
 * @description Pantalla de carga estilo WhatsApp con blur-xl y animación de despegue.
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingOverlay = ({ message = "Inyectando configuración en RAM..." }) => (
  <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-surface-main/95 backdrop-blur-xl animate-in fade-in duration-500">
    <div className="relative flex items-center justify-center mb-6">
      {/* Círculo de carga estilo WhatsApp */}
      <Loader2 className="text-emerald-500 animate-spin shrink-0" size={48} />
      <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse" />
    </div>
    <p className="text-emerald-500 font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">
      {message}
    </p>
  </div>
);
