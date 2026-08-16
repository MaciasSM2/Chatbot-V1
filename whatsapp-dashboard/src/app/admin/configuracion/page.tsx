'use client';

import React, { useEffect, useState } from 'react';
import { useBrandStore } from '../../../application/store/useBrandStore';
import { useModuleStore } from '../../../application/store/useModuleStore';
import { Settings, Sparkles, Clock, Sliders, CheckCircle, BrainCircuit, Paintbrush } from 'lucide-react';
import { TimePeriodsConfig } from '../../../components/admin/config/TimePeriodsConfig';
import { LiveStatusPreview } from '../../../components/admin/config/LiveStatusPreview';
import ThemeConfigurator from '../../../components/ThemeConfigurator';
import { UserManagement } from '../../../components/admin/UserManagement';
const FIXED_PRESETS = [
  { id: 'WHATSAPP_GREEN', label: 'Verde Whatsapp', color: '#25D366' },
  { id: 'BLUE',          label: 'Azul Real',      color: '#2563EB' },
  { id: 'PURPLE',        label: 'Morado Místico', color: '#8B5CF6' },
  { id: 'RED',           label: 'Crimson Core',   color: '#DC2626' },
  { id: 'CYAN',          label: 'Teal Abisal',    color: '#06B6D4' },
];

export default function UnifiedConfigurationDashboard() {
  const { settings, loadFromDatabase, persistChanges, updateThemePalette, listenCrossTabChanges, isSaving } = useBrandStore();
  const { modules, fetchModules, toggleModule } = useModuleStore();
  const [localFields, setLocalFields] = useState<any>(null);
  const [showSuccessBadge, setShowSuccessBadge] = useState(false);

  useEffect(() => {
    loadFromDatabase();
    fetchModules();
    listenCrossTabChanges(); // Activar la escucha asíncrona entre pestañas abiertas
  }, [loadFromDatabase, fetchModules, listenCrossTabChanges]);

  useEffect(() => {
    if (settings) setLocalFields({ ...settings });
  }, [settings]);

  if (!localFields) return <div className="p-8 font-mono text-xs text-[var(--theme-accent)]">&gt; SINCRO IOC...</div>;

  const handleUpdate = (key: string, value: any) => {
    setLocalFields((prev: any) => ({ ...prev, [key]: value }));
    if (key === 'themeAccent') {
      const isDark = document.documentElement.classList.contains('dark');
      updateThemePalette(value, isDark, true); // Actualización instantánea cross-tab activa
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await persistChanges(localFields);
    if (success) {
      setShowSuccessBadge(true);
      setTimeout(() => setShowSuccessBadge(false), 3000);
    }
  };

  const isCustomHex = localFields.themeAccent?.startsWith('#') ?? false;

  return (
    <div className="space-y-8 p-2 text-xs text-text-main animate-in fade-in">
      <div className="pb-6 border-b border-border-strong flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
            <Settings className="text-[var(--theme-accent)]" size={18} /> Consola de Configuración Estructurada
          </h2>
        </div>
        {showSuccessBadge && <div className="bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] px-4 py-2 border border-[var(--theme-accent)]/20 rounded-xl font-bold">MARIADB ACTUALIZADA</div>}
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-8">
        {/* BLOQUE 1: IDENTIDAD VISUAL */}
        <div className="bg-bg-card border border-border-subtle rounded-[2rem] p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 pb-2 border-b border-border-subtle">
            <Sparkles size={14} className="text-[var(--theme-accent)]" />
            <h4 className="font-black uppercase tracking-wider text-[11px]">1. Parametrización General e Identidad Visual</h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-black text-text-muted tracking-widest">Razón Social</label>
              <input type="text" value={localFields.companyName} onChange={e => handleUpdate('companyName', e.target.value)} className="bg-bg-input border border-border-subtle rounded-xl px-4 py-3" placeholder="Razón Social" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-black text-text-muted tracking-widest">Eslogan</label>
              <input type="text" value={localFields.companySlogan || ''} onChange={e => handleUpdate('companySlogan', e.target.value)} className="bg-bg-input border border-border-subtle rounded-xl px-4 py-3" placeholder="Eslogan" />
            </div>
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-[10px] uppercase font-black text-text-muted tracking-widest">Instrucciones del Asistente</label>
              <textarea rows={2} value={localFields.institutionalLanguage} onChange={e => handleUpdate('institutionalLanguage', e.target.value)} className="bg-bg-input border border-border-subtle rounded-xl px-4 py-3 resize-none" required />
            </div>
          </div>
        </div>

        {/* BLOQUE 2: MOTOR DE TIEMPOS Y PALETAS COMPUESTO */}
        <div className="bg-bg-card border border-border-subtle rounded-[2rem] p-6 space-y-6 shadow-xl">
          <div className="flex items-center gap-2 pb-2 border-b border-border-subtle">
            <Clock size={14} className="text-[var(--theme-accent)]" />
            <h4 className="font-black uppercase tracking-wider text-[11px]">2. Configuración Avanzada de Tiempos y Paletas Cromáticas</h4>
          </div>

          {/* MATRIZ DE PRESETS Y CUSTOM PICKER SEGUIDO (LOCAL THEME) */}
          <div className="mb-4">
            <ThemeConfigurator />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pt-2">
            <div className="lg:col-span-1 bg-bg-input/40 p-4 border border-border-subtle rounded-2xl"><LiveStatusPreview /></div>
            <div className="lg:col-span-3 bg-bg-input/40 p-4 border border-border-subtle rounded-2xl"><TimePeriodsConfig onSyncRequired={() => loadFromDatabase()} /></div>
          </div>
        </div>

        {/* BLOQUE 3: INFRAESTRUCTURA */}
        <div className="bg-bg-card border border-border-subtle rounded-[2rem] p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 pb-2 border-b border-border-subtle">
            <Sliders size={14} className="text-[var(--theme-accent)]" />
            <h4 className="font-black uppercase tracking-wider text-[11px]">3. Gobernanza de Módulos de Fondo</h4>
          </div>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex gap-3 flex-wrap">
              {modules.map((m: any) => (
                <div key={m.id} className="p-3 bg-bg-input border border-border-subtle rounded-xl flex items-center gap-4">
                  <span className="font-bold">{m.name}</span>
                  <button type="button" onClick={() => toggleModule(m.id, m.active)} className={`w-8 h-4 rounded-full relative p-0.5 transition-colors ${m.active ? 'bg-[var(--theme-accent)]' : 'bg-zinc-800'}`}>
                    <div className={`w-3 h-3 rounded-full bg-white transform duration-150 ${m.active ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
              ))}
            </div>
            <button type="submit" disabled={isSaving} className="bg-[var(--theme-accent)] hover:brightness-110 text-white font-black uppercase tracking-widest px-6 py-3.5 rounded-xl transition-all cursor-pointer shadow-xl shadow-[var(--theme-accent)]/10 disabled:opacity-40">
              {isSaving ? 'Aplicando...' : 'APLICAR PARAMETRIZACIÓN GENERAL'}
            </button>
          </div>
        </div>
      </form>

      {/* BLOQUE 4: GESTIÓN DE USUARIOS Y PERFILES (DESARROLLADOR) */}
      <UserManagement />
    </div>
  );
}
