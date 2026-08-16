'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MessageSquare, Settings, Users, MessageCircle, Calendar, FileText, Sun, Moon } from 'lucide-react';
import { useBrandStore } from '../../application/store/useBrandStore';

const activeClass = "bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border-l-4 border-[var(--theme-accent)] shadow-[15px_0_25px_-10px_var(--theme-accent)]/20";
const inactiveClass = "text-text-muted hover:bg-bg-card-hover hover:text-[var(--theme-accent)] transition-all duration-300";

interface SidebarProps {
  isDark?: boolean;
  onToggleTheme?: () => void;
  showSimulatorLink?: boolean;
  simulatorContent?: React.ReactNode;
  operatorRole?: string;
}

export function Sidebar({ isDark, onToggleTheme, showSimulatorLink = false, simulatorContent }: SidebarProps) {
  const pathname = usePathname();
  const { settings } = useBrandStore();

  const navigation = [
    { name: 'Inicio', href: '/admin', icon: LayoutDashboard },
    { name: 'Saludos (Smart)', href: '/admin/saludos', icon: MessageSquare },
    { name: 'Clientes', href: '/admin/clientes', icon: Users },
    { name: 'Calendario', href: '/admin/calendario', icon: Calendar },
    { name: 'Facturacion', href: '/admin/facturacion', icon: FileText },
    { name: 'Configuracion', href: '/admin/configuracion', icon: Settings },
    { name: 'Volver a los chats', href: '/muestra', icon: MessageCircle },
  ];

  return (
    <div className="w-64 bg-bg-sidebar border-r border-[var(--border-subtle)] backdrop-blur-md flex flex-col shrink-0 justify-between transition-all duration-300">
      <div className="p-6 border-b border-border-subtle">
        {showSimulatorLink && (
          <Link href="/muestra" className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-emerald-900/20 mb-4">
            <MessageCircle size={18} />
            Volver a los chats
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

      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href + '/'));
          const Icon = item.icon;

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
        <span>v2.0.0</span>
        <span className="font-bold uppercase text-[var(--theme-accent)] tracking-widest animate-pulse">Online</span>
      </div>
    </div>
  );
}
