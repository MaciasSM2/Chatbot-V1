'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MessageSquare, Settings, Users, MessageCircle, Calendar, Lock, FileText, Sun, Moon } from 'lucide-react';
import { useModuleStore } from '../../application/store/useModuleStore';
import { useBrandStore } from '../../application/store/useBrandStore';

const activeClass = "bg-brand-primary/10 text-brand-primary border-l-4 border-brand-primary shadow-[15px_0_25px_-10px_rgba(16,185,129,0.2)]";
const inactiveClass = "text-text-muted hover:bg-white/[0.03] hover:text-brand-primary transition-all duration-300";

interface SidebarProps {
  isDark?: boolean;
  onToggleTheme?: () => void;
  showSimulatorLink?: boolean;
  simulatorContent?: React.ReactNode;
  operatorRole?: string;
}

export function Sidebar({ isDark, onToggleTheme, showSimulatorLink = false, simulatorContent }: SidebarProps) {
  const pathname = usePathname();
  const { modules } = useModuleStore();
  const { settings } = useBrandStore();

  const navigation = [
    { name: 'Inicio', href: '/admin', icon: LayoutDashboard, moduleId: 'dashboard_home' },
    { name: 'Saludos (Smart)', href: '/admin/saludos', icon: MessageSquare, moduleId: 'module_greetings' },
    { name: 'Clientes', href: '/admin/clientes', icon: Users, moduleId: 'module_clients' },
    { name: 'Calendario', href: '/admin/calendario', icon: Calendar },
    { name: 'Facturacion', href: '/admin/facturacion', icon: FileText },
    { name: 'Configuracion', href: '/admin/configuracion', icon: Settings },
  ];

  return (
    <div className="w-64 bg-[#070A0E]/80 dark:bg-black/40 border-r border-[var(--border-subtle)] backdrop-blur-md flex flex-col shrink-0 justify-between transition-all duration-300">
      <div className="p-6 border-b border-border-subtle">
        {showSimulatorLink && (
          <Link href="/" className="flex items-center justify-center gap-2 w-full bg-brand-primary hover:bg-brand-hover text-background-panel py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-brand-primary/10 mb-4">
            <MessageCircle size={18} />
            Ver Simulador
          </Link>
        )}
        {simulatorContent}
        <div className="flex items-center gap-3 mt-2">
          {settings?.companyLogoUrl && (
            <img
              src={settings.companyLogoUrl}
              alt="Logo"
              className="w-7 h-7 rounded-xl object-contain border border-[var(--border-subtle)] bg-white/10"
            />
          )}
          <div>
            <h1 className="text-xs font-black uppercase tracking-tight text-text-main truncate max-w-[160px]">
              {settings?.companyName || 'ChatBot Admin'}
            </h1>
            <span className="text-[9px] text-text-muted font-bold block tracking-wider uppercase">Panel de Control</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const isEnabled = item.moduleId
            ? (modules.find((m: any) => m.id === item.moduleId)?.is_enabled ?? true)
            : true;

          const Icon = isEnabled ? item.icon : Lock;

          if (!isEnabled) {
            return (
              <div
                key={item.name}
                className="flex items-center justify-between px-4 py-3 rounded-lg text-text-muted opacity-60 bg-transparent border border-border-subtle/50 cursor-not-allowed select-none transition-all duration-300"
                title="Este modulo ha sido desactivado por el Administrador"
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} className="text-text-muted/40" />
                  <span className="font-medium text-sm line-through decoration-border-subtle">{item.name}</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 font-extrabold tracking-widest uppercase scale-90">
                  Off
                </span>
              </div>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? activeClass : inactiveClass}`}
            >
              <Icon size={20} />
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border-subtle text-xs text-center text-text-muted flex justify-between font-mono">
        {onToggleTheme && (
          <button onClick={onToggleTheme} className="hover:text-content-primary transition-colors cursor-pointer" title={isDark ? 'Modo claro' : 'Modo oscuro'}>
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        )}
        <span>v1.0.0</span>
        <span className="font-bold uppercase text-[var(--theme-accent)] tracking-widest animate-pulse">Online</span>
      </div>
    </div>
  );
}
