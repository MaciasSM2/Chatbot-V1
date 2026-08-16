'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../application/store/useAuthStore';
import { Lock, Mail, Key, ShieldCheck, ArrowRight, Bot, Code, Zap, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, currentUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const success = login(email, password);
    if (success) {
      const user = useAuthStore.getState().currentUser;
      redirectByRole(user?.role);
    } else {
      setErrorMsg('❌ Credenciales inválidas. Verifica tu usuario y contraseña.');
    }
  };

  const redirectByRole = (role?: string) => {
    if (role === 'USER_FULL_JS') router.push('/admin-a');
    else if (role === 'USER_HYBRID') router.push('/admin-b');
    else if (role === 'USER_FULL_AI') router.push('/admin-c');
    else router.push('/admin/configuracion');
  };

  const handleQuickLogin = (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    const success = login(quickEmail, quickPass);
    if (success) {
      const user = useAuthStore.getState().currentUser;
      redirectByRole(user?.role);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-bg-main text-text-main flex items-center justify-center p-4 font-sans select-none transition-colors duration-300">
      <div className="w-full max-w-md bg-bg-panel border border-border-subtle rounded-[2.5rem] p-8 shadow-2xl space-y-6">
        
        {/* ENCABEZADO Y LOGO */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/20 rounded-2xl flex items-center justify-center mx-auto text-[var(--theme-accent)] shadow-lg">
            <Lock size={28} />
          </div>
          <h1 className="text-xl font-black tracking-tight uppercase text-text-main">
            Acceso Ecosistema WhatsApp
          </h1>
          <p className="text-xs text-text-dim">
            Ingresa tus credenciales para acceder al backend y paneles de control.
          </p>
        </div>

        {/* FORMULARIO DE ACCESO */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase font-black text-text-muted mb-1 tracking-widest">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 text-text-dim" size={16} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@bot.com"
                className="w-full bg-bg-input border border-border-subtle rounded-xl pl-10 pr-4 py-2.5 text-xs text-text-main focus:outline-none focus:border-[var(--theme-accent)] font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-black text-text-muted mb-1 tracking-widest">
              Contraseña
            </label>
            <div className="relative">
              <Key className="absolute left-3.5 top-3 text-text-dim" size={16} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-bg-input border border-border-subtle rounded-xl pl-10 pr-4 py-2.5 text-xs text-text-main focus:outline-none focus:border-[var(--theme-accent)] font-mono"
                required
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center font-mono">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-[var(--theme-accent)] hover:brightness-110 text-white font-black uppercase tracking-widest py-3 rounded-xl transition-all shadow-lg shadow-[var(--theme-accent)]/20 flex items-center justify-center gap-2 text-xs cursor-pointer"
          >
            <span>Iniciar Sesión</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="border-t border-border-subtle pt-4 space-y-3">
          <span className="text-[10px] font-black uppercase text-text-muted tracking-widest block text-center">
            Acceso Rápido por Perfil (Entorno Demostración)
          </span>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleQuickLogin('desarrollador@bot.com', 'admin123')}
              className="p-2.5 bg-bg-card hover:bg-bg-card-hover border border-border-subtle rounded-xl text-left transition-all"
            >
              <div className="font-bold text-purple-400 flex items-center gap-1.5 text-[11px]">
                <ShieldCheck size={14} /> 1. Desarrollador
              </div>
              <div className="text-[9px] text-text-dim truncate">Acceso Total Backend</div>
            </button>

            <button
              onClick={() => handleQuickLogin('fulljs@bot.com', 'js123')}
              className="p-2.5 bg-bg-card hover:bg-bg-card-hover border border-border-subtle rounded-xl text-left transition-all"
            >
              <div className="font-bold text-blue-400 flex items-center gap-1.5 text-[11px]">
                <Code size={14} /> 2. Full JS
              </div>
              <div className="text-[9px] text-text-dim truncate">Exclusivo Chat 1</div>
            </button>

            <button
              onClick={() => handleQuickLogin('hibrido@bot.com', 'hybrid123')}
              className="p-2.5 bg-bg-card hover:bg-bg-card-hover border border-border-subtle rounded-xl text-left transition-all"
            >
              <div className="font-bold text-amber-400 flex items-center gap-1.5 text-[11px]">
                <Zap size={14} /> 3. Híbrido
              </div>
              <div className="text-[9px] text-text-dim truncate">Exclusivo Chat 2</div>
            </button>

            <button
              onClick={() => handleQuickLogin('fullia@bot.com', 'ai123')}
              className="p-2.5 bg-bg-card hover:bg-bg-card-hover border border-border-subtle rounded-xl text-left transition-all"
            >
              <div className="font-bold text-emerald-400 flex items-center gap-1.5 text-[11px]">
                <Sparkles size={14} /> 4. Full IA
              </div>
              <div className="text-[9px] text-text-dim truncate">Exclusivo Chat 3</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
