'use client';

import React, { useState } from 'react';
import { ShieldCheck, UserCheck, Lock, Unlock, RefreshCw } from 'lucide-react';

interface IUserPermissionState {
  id: string;
  name: string;
  email: string;
  role: 'USER_FULL_JS' | 'USER_HYBRID' | 'USER_FULL_AI' | 'DEVELOPER';
  canAccessQuadChat: boolean;
  canAccessModules: boolean;
}

const INITIAL_USERS: IUserPermissionState[] = [
  { id: '1', name: 'Desarrollador Principal', email: 'desarrollador@bot.com', role: 'DEVELOPER', canAccessQuadChat: true, canAccessModules: true },
  { id: '2', name: 'Operador JS', email: 'fulljs@bot.com', role: 'USER_FULL_JS', canAccessQuadChat: false, canAccessModules: true },
  { id: '3', name: 'Operador Híbrido', email: 'hibrido@bot.com', role: 'USER_HYBRID', canAccessQuadChat: false, canAccessModules: true },
  { id: '4', name: 'Operador IA Generativa', email: 'fullia@bot.com', role: 'USER_FULL_AI', canAccessQuadChat: false, canAccessModules: true },
];

export function AdminUserPermissionManager() {
  const [users, setUsers] = useState<IUserPermissionState[]>(INITIAL_USERS);

  const toggleQuadChat = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, canAccessQuadChat: !u.canAccessQuadChat } : u))
    );
  };

  const toggleModules = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, canAccessModules: !u.canAccessModules } : u))
    );
  };

  return (
    <div className="p-6 bg-[#0b0c0d] min-h-full text-white space-y-6">
      <div className="bg-[#141517] border border-white/10 p-6 rounded-2xl flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="text-base font-black uppercase tracking-wider text-white">
              Gestión de Permisos por Perfil (RBAC Admin)
            </h2>
            <p className="text-xs text-zinc-400">
              Asigna o revoca acceso dinámicamente al Quad-Chat y módulos del sistema por usuario
            </p>
          </div>
        </div>
        <span className="text-xs font-mono bg-purple-950 text-purple-300 border border-purple-800 px-3 py-1 rounded-full">
          Permiso MANAGE_USER_PERMISSIONS Activo
        </span>
      </div>

      <div className="bg-[#141517] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#1c1e21] border-b border-white/10 text-zinc-400 font-mono uppercase">
            <tr>
              <th className="p-4">Usuario</th>
              <th className="p-4">Rol Asignado</th>
              <th className="p-4">Acceso Quad-Chat (Simultáneo)</th>
              <th className="p-4">Acceso a Módulos</th>
              <th className="p-4 text-right">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="p-4">
                  <div className="font-bold text-white">{u.name}</div>
                  <div className="text-[10px] text-zinc-400 font-mono">{u.email}</div>
                </td>
                <td className="p-4">
                  <span className="px-2.5 py-1 rounded-full font-mono text-[10px] bg-white/5 border border-white/10 text-zinc-300">
                    {u.role}
                  </span>
                </td>
                <td className="p-4">
                  <button
                    onClick={() => toggleQuadChat(u.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                      u.canAccessQuadChat
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-zinc-800 text-zinc-500 border border-white/5'
                    }`}
                  >
                    {u.canAccessQuadChat ? <Unlock size={14} /> : <Lock size={14} />}
                    <span>{u.canAccessQuadChat ? 'Habilitado' : 'Bloqueado'}</span>
                  </button>
                </td>
                <td className="p-4">
                  <button
                    onClick={() => toggleModules(u.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                      u.canAccessModules
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : 'bg-zinc-800 text-zinc-500 border border-white/5'
                    }`}
                  >
                    {u.canAccessModules ? <Unlock size={14} /> : <Lock size={14} />}
                    <span>{u.canAccessModules ? 'Unlocked Total' : 'Restringido'}</span>
                  </button>
                </td>
                <td className="p-4 text-right">
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
                    Sincronizado
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
