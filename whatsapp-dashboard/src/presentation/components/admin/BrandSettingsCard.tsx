'use client';

import React, { useEffect, useState } from 'react';
import { useBrandStore, BrandData } from '../../../application/store/useBrandStore';
import { ShieldCheck, Sliders, Save } from 'lucide-react';

/**
 * @component BrandSettingsCard
 * @description Panel administrativo de "Casillas de Identación" para el control psicolingüístico del bot.
 */
export const BrandSettingsCard: React.FC = () => {
  const { brandData, isLoading, error, fetchBrandConfig, updateBrandConfig } = useBrandStore();
  
  // Estado local para control de inputs mutables (Form Pattern)
  const [formData, setFormData] = useState<BrandData>({
    companyName: '',
    companySlogan: '',
    institutionalLanguage: '',
    companyLogoUrl: '',
    startWorkHour: '08:00',
    endWorkHour: '18:00',
    operationMode: 1,
    themeAccent: 'WHATSAPP_GREEN'
  });

  useEffect(() => {
    fetchBrandConfig();
  }, [fetchBrandConfig]);

  // Sincronizar estado local cuando el Store global resuelva la petición HTTP
  useEffect(() => {
    if (brandData) {
      const timer = setTimeout(() => {
        setFormData(brandData);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [brandData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'operationMode' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateBrandConfig(formData);
  };

  if (isLoading && !brandData) {
    return <div className="text-xs font-mono text-brand-primary animate-pulse p-6">Loading engine brand entities...</div>;
  }

  return (
    <div className="bg-background-panel border border-border-subtle rounded-[2rem] overflow-hidden shadow-2xl shadow-black/50 transition-all duration-300">
      
      {/* Header Táctico */}
      <div className="bg-background-header px-8 py-5 border-b border-border-subtle flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-primary/10 rounded-xl text-brand-primary border border-brand-primary/20">
            <Sliders size={16} />
          </div>
          <div>
            <h3 className="text-xs font-black text-text-main tracking-widest uppercase">Casillas de Identación</h3>
            <p className="text-[10px] text-text-muted mt-0.5">Parámetros de inyección adaptativa para el System Prompt.</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-brand-primary/5 px-2.5 py-1 rounded-full border border-brand-primary/20">
          <ShieldCheck size={12} className="text-brand-primary" />
          <span className="text-[9px] text-brand-primary font-bold tracking-wider uppercase">FSM Direct-Link</span>
        </div>
      </div>

      {/* Formulario Controlado */}
      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl font-mono">
            {`> ERROR: ${error}`}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input: Nombre de la Empresa */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-muted tracking-widest uppercase block">Nombre Institucional</label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleInputChange}
              className="w-full bg-background-input border border-border-subtle rounded-xl px-4 py-3 text-xs text-text-main outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/30 transition-all font-medium"
              placeholder="Ej. Libros Medellín"
              required
            />
          </div>

          {/* Input: Slogan */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-muted tracking-widest uppercase block">Slogan Corporativo</label>
            <input
              type="text"
              name="companySlogan"
              value={formData.companySlogan || ''}
              onChange={handleInputChange}
              className="w-full bg-background-input border border-border-subtle rounded-xl px-4 py-3 text-xs text-text-main outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/30 transition-all font-medium"
              placeholder="Frase comercial de impacto"
            />
          </div>
        </div>

        {/* Input: URL del Logo */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-text-muted tracking-widest uppercase block">URL Vector / Isotipo de Marca</label>
          <input
            type="url"
            name="companyLogoUrl"
            value={formData.companyLogoUrl}
            onChange={handleInputChange}
            className="w-full bg-background-input border border-border-subtle rounded-xl px-4 py-3 text-xs text-text-main outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/30 transition-all font-mono"
            placeholder="https://domain.com/assets/logo.svg"
          />
        </div>

        {/* Sección de Configuración Operativa */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Hora de Inicio */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-muted tracking-widest uppercase block">Hora Apertura (HH:MM)</label>
            <input
              type="text"
              name="startWorkHour"
              value={formData.startWorkHour}
              onChange={handleInputChange}
              className="w-full bg-background-input border border-border-subtle rounded-xl px-4 py-3 text-xs text-text-main outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/30 transition-all font-mono"
              placeholder="08:00"
              required
            />
          </div>

          {/* Hora de Cierre */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-muted tracking-widest uppercase block">Hora Cierre (HH:MM)</label>
            <input
              type="text"
              name="endWorkHour"
              value={formData.endWorkHour}
              onChange={handleInputChange}
              className="w-full bg-background-input border border-border-subtle rounded-xl px-4 py-3 text-xs text-text-main outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/30 transition-all font-mono"
              placeholder="18:00"
              required
            />
          </div>

          {/* Switch de Operación */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-muted tracking-widest uppercase block">Modo Operacional</label>
            <select
              name="operationMode"
              value={formData.operationMode}
              onChange={handleInputChange}
              className="w-full bg-background-input border border-border-subtle rounded-xl px-4 py-3 text-xs text-text-main outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/30 transition-all font-medium"
            >
              <option value={0}>Apagado (Fuera de Servicio)</option>
              <option value={1}>Simulador (Demo interactivo)</option>
              <option value={2}>Producción (En vivo)</option>
            </select>
          </div>
        </div>

        {/* Textarea: Lenguaje Institucional / Psicolingüística */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-text-muted tracking-widest uppercase block">Lineamientos Psicolingüísticos (Tono del Bot)</label>
          <textarea
            name="institutionalLanguage"
            value={formData.institutionalLanguage}
            onChange={handleInputChange}
            rows={5}
            className="w-full bg-background-input border border-border-subtle rounded-xl p-4 text-xs text-text-main leading-relaxed outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/30 transition-all resize-none font-medium"
            placeholder="Copia aquí el manual de lenguaje institucional o lineamientos de marca que el bot debe adoptar de forma obligatoria..."
          />
        </div>

        {/* Separador de Sección de Alta Visibilidad Unificado */}
        <div className="h-px bg-gradient-to-r from-transparent via-border-strong to-transparent my-6" />

        {/* Botón de Guardado */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 bg-brand-primary hover:bg-brand-hover text-white font-bold px-6 py-3 rounded-xl text-xs tracking-wider uppercase transition-all shadow-lg shadow-brand-primary/20 active:scale-98 disabled:opacity-50"
          >
            <Save size={14} />
            {isLoading ? 'Sincronizando...' : 'Guardar y Sincronizar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
};
