'use client';
import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MessageSquare, Settings, Users, MessageCircle, Calendar, Lock } from 'lucide-react';
import { useModuleStore } from '../../application/store/useModuleStore';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { modules, loadModules } = useModuleStore();

  useEffect(() => {
    loadModules();
  }, [loadModules]);

  const navigation = [
    { name: 'Inicio', href: '/admin', icon: LayoutDashboard, moduleId: 'dashboard_home' },
    { name: 'Saludos (Smart)', href: '/admin/saludos', icon: MessageSquare, moduleId: 'module_greetings' },
    { name: 'Clientes', href: '/admin/clientes', icon: Users, moduleId: 'module_clients' },
    { name: 'Calendario', href: '/admin/calendario', icon: Calendar },
    { name: 'Configuración', href: '/admin/configuracion', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <Link href="/" className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-900/20 mb-4">
            <MessageCircle size={18} />
            Ver Simulador
          </Link>
          <h1 className="text-xl font-bold tracking-wider">ChatBot Admin</h1>
          <p className="text-xs text-gray-400 mt-1">Panel de Control</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const isEnabled = item.moduleId 
              ? (modules.find(m => m.id === item.moduleId)?.is_enabled ?? true)
              : true;
            
            const Icon = isEnabled ? item.icon : Lock;
            
            if (!isEnabled) {
              return (
                <div
                  key={item.name}
                  className="flex items-center justify-between px-4 py-3 rounded-lg text-gray-500 opacity-60 bg-gray-950/20 border border-gray-800/10 cursor-not-allowed select-none transition-all duration-300"
                  title="Este módulo ha sido desactivado por el Administrador"
                >
                  <div className="flex items-center gap-3">
                    <Icon size={20} className="text-gray-600" />
                    <span className="font-medium text-sm line-through decoration-gray-700/60">{item.name}</span>
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
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800 text-xs text-center text-gray-500">
          Versión 1.0.0
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
