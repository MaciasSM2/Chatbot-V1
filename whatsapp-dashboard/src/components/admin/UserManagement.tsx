'use client';

import React, { useState } from 'react';
import { useAuthStore, UserRole } from '../../application/store/useAuthStore';
import { UserPlus, Shield, Trash2, Key, Users, CheckCircle } from 'lucide-react';

export function UserManagement() {
  const { currentUser, usersList, addUser, deleteUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('USER_FULL_JS');
  const [statusMsg, setStatusMsg] = useState('');

  if (currentUser?.role !== 'DEVELOPER') {
    return (
      <div className="p-4 bg-bg-card border border-border-subtle rounded-2xl text-xs text-text-dim">
        🔒 La gestión de usuarios y creación de accesos es exclusiva para el perfil <strong>DESARROLLADOR</strong>.
      </div>
    );
  }

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim() || !password.trim()) return;

    addUser({
      email: email.trim(),
      name: name.trim(),
      passwordHash: password.trim(),
      role
    });

    setEmail('');
    setName('');
    setPassword('');
    setStatusMsg(`✅ Usuario ${name} creado con perfil [${role}].`);
    setTimeout(() => setStatusMsg(''), 4000);
  };

  return (
    <div className="bg-bg-panel border border-border-subtle rounded-[2rem] p-6 space-y-6 shadow-xl text-xs text-text-main">
      <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <Shield className="text-[var(--theme-accent)]" size={18} />
          <h3 className="font-black uppercase tracking-wider text-[11px]">
            Gestión de Usuarios & Asignación de Roles (Perfil Desarrollador)
          </h3>
        </div>
        <span className="px-3 py-1 bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border border-[var(--theme-accent)]/20 rounded-full font-mono text-[10px] font-bold">
          4 Perfiles Soportados
        </span>
      </div>

      <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-bg-input/40 p-4 rounded-2xl border border-border-subtle">
        <div>
          <label className="block text-[10px] uppercase font-black text-text-muted mb-1">Nombre Completo</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Carlos Pérez"
            className="w-full bg-bg-input border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-main focus:outline-none focus:border-[var(--theme-accent)]"
            required
          />
        </div>

        <div>
          <label className="block text-[10px] uppercase font-black text-text-muted mb-1">Correo Electrónico</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="operador@bot.com"
            className="w-full bg-bg-input border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-main focus:outline-none focus:border-[var(--theme-accent)]"
            required
          />
        </div>

        <div>
          <label className="block text-[10px] uppercase font-black text-text-muted mb-1">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-bg-input border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-main focus:outline-none focus:border-[var(--theme-accent)] font-mono"
            required
          />
        </div>

        <div>
          <label className="block text-[10px] uppercase font-black text-text-muted mb-1">Perfil / Rol Asignado</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="w-full bg-bg-input border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-main focus:outline-none focus:border-[var(--theme-accent)]"
          >
            <option value="DEVELOPER">1. Desarrollador (Acceso Total)</option>
            <option value="USER_FULL_JS">2. Usuario Full JS (Chat 1)</option>
            <option value="USER_HYBRID">3. Usuario Híbrido (Chat 2)</option>
            <option value="USER_FULL_AI">4. Usuario Full IA (Chat 3)</option>
          </select>
        </div>

        <div className="md:col-span-4 flex items-center justify-between pt-2">
          <button
            type="submit"
            className="bg-[var(--theme-accent)] hover:brightness-110 text-white font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-2"
          >
            <UserPlus size={14} />
            Crear y Registrar Usuario
          </button>
          {statusMsg && <span className="font-mono text-xs text-[var(--theme-accent)]">{statusMsg}</span>}
        </div>
      </form>

      {/* LISTA DE USUARIOS REGISTRADOS */}
      <div className="space-y-3">
        <h4 className="font-bold text-text-main text-xs uppercase tracking-wider flex items-center gap-2">
          <Users size={14} className="text-[var(--theme-accent)]" /> Usuarios del Ecosistema ({usersList.length})
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {usersList.map((usr) => (
            <div key={usr.id} className="p-3.5 bg-bg-card border border-border-subtle rounded-xl flex items-center justify-between">
              <div>
                <div className="font-bold text-text-main flex items-center gap-2">
                  <span>{usr.name}</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold ${
                    usr.role === 'DEVELOPER' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                    usr.role === 'USER_FULL_JS' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                    usr.role === 'USER_HYBRID' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {usr.role}
                  </span>
                </div>
                <div className="text-[11px] text-text-dim font-mono">{usr.email}</div>
              </div>

              {usr.id !== currentUser.id && (
                <button
                  onClick={() => deleteUser(usr.id)}
                  className="p-1.5 text-text-dim hover:text-red-400 transition-colors"
                  title="Eliminar usuario"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
