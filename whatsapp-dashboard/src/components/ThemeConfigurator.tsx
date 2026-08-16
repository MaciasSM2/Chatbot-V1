"use client";

import React, { useState } from 'react';
import { useThemeStore } from '../application/store/themeStore';
import { useTheme } from '../application/providers/ThemeContext';
import { PRESETS, generateColorScale } from '../core/colorScale';
import { Sun, Moon, ChevronDown } from 'lucide-react';

export default function ThemeConfigurator() {
  const { primaryColor, presetName, setPreset, setPrimaryColor } = useThemeStore();
  const { isDark, toggleTheme } = useTheme();
  const [showCustom, setShowCustom] = useState(false);

  const scale = generateColorScale(primaryColor);
  const current = isDark ? scale.dark : scale.light;

  const gradientPreview = `linear-gradient(90deg, ${current.bgBase} 0%, ${current.bgCard} 30%, ${current.bgHeader} 60%, ${current.bgCardHover} 100%)`;

  return (
    <div className="bg-bg-panel p-6 rounded-lg border border-border-subtle space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-text-main mb-2">Tema Visual</h3>
        <p className="text-sm text-text-dim mb-4">Personaliza los colores de toda la interfaz.</p>

        <div className="flex items-center gap-2 mb-6 bg-bg-card-hover rounded-xl p-1 w-fit">
          <button
            onClick={() => !isDark && toggleTheme()}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              !isDark ? 'bg-bg-card text-text-main shadow-sm' : 'text-text-dim hover:text-text-main'
            }`}
          >
            <Sun size={16} />
            Claro
          </button>
          <button
            onClick={() => isDark && toggleTheme()}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isDark ? 'bg-bg-panel text-text-main shadow-sm' : 'text-text-dim hover:text-text-main'
            }`}
          >
            <Moon size={16} />
            Oscuro
          </button>
        </div>
      </div>

      <div>
        <h4 className="text-text-main font-medium mb-3">Color Primario</h4>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {PRESETS.map((preset) => {
            const isSelected = primaryColor.toUpperCase() === preset.hex.toUpperCase();
            return (
              <button
                key={preset.hex}
                onClick={() => setPreset(preset.name, preset.hex)}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-all hover:scale-105 ${
                  isSelected
                    ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/10'
                    : 'border-transparent hover:border-border-strong'
                }`}
                title={preset.name}
              >
                <span
                  className="w-8 h-8 rounded-full ring-1 ring-black/10"
                  style={{ backgroundColor: preset.hex }}
                />
                <span className={`text-[10px] font-medium truncate w-full text-center ${
                  isSelected ? 'text-[var(--theme-accent)]' : 'text-text-dim'
                }`}>
                  {preset.name}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setShowCustom(!showCustom)}
          className="flex items-center gap-1.5 mt-3 text-xs text-text-dim hover:text-text-main transition-colors"
        >
          <ChevronDown size={14} className={`transition-transform ${showCustom ? 'rotate-180' : ''}`} />
          Color personalizado
        </button>

        {showCustom && (
          <div className="mt-2 flex items-center gap-3">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer border border-border-strong p-0.5"
            />
            <span className="text-xs font-mono text-text-dim">{primaryColor}</span>
          </div>
        )}
      </div>

      <div>
        <h4 className="text-text-main font-medium mb-2">Vista Previa de Escala</h4>
        <div
          className="h-10 rounded-lg border border-border-subtle"
          style={{ background: gradientPreview }}
        />
        <div className="flex gap-3 mt-2">
          {[current.accent, current.bgCard, current.bgSidebar, current.bgCardHover, current.bgHeader, current.borderSubtle, current.borderStrong].map((color, i) => (
            <span
              key={i}
              className="w-6 h-6 rounded border border-border-subtle"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
