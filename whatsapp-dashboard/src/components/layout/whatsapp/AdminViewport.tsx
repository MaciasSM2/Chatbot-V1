'use client';

import React from 'react';
import { useWhatsAppLayoutStore } from '../../../application/store/useWhatsAppLayoutStore';
import { WHATSAPP_TOKENS } from '../../../theme/designTokens';
import UnifiedConfigurationDashboard from '../../../app/admin/configuracion/page';
import ThemeConfigurator from '../../ThemeConfigurator';
import { ApiKeyConfigurator } from '../../config/ApiKeyConfigurator';
import { QuotaConfigurator } from '../../config/QuotaConfigurator';
import { EmbedWidgetGenerator } from '../../widget/EmbedWidgetGenerator';
import { UserManagement } from '../../admin/UserManagement';
import AdminInicioDashboard from '../../../app/admin/page';
import SaludosPage from '../../../app/admin/saludos/page';
import ClientesPage from '../../../app/admin/clientes/page';
import CalendarioPage from '../../../app/admin/calendario/page';
import FacturacionPage from '../../../app/admin/facturacion/page';

export function AdminViewport() {
  const { activeModuleId, activeSubModuleId } = useWhatsAppLayoutStore();

  const renderContent = () => {
    // Renderizado según el sub-módulo seleccionado en la sección de Configuración
    if (activeModuleId === 'configuraciones') {
      switch (activeSubModuleId) {
        case 'brand-identity':
          return <ThemeConfigurator />;
        case 'api-keys':
          return <ApiKeyConfigurator />;
        case 'quota-limits':
          return <QuotaConfigurator />;
        case 'embed-widget':
          return <EmbedWidgetGenerator />;
        case 'user-management':
          return <UserManagement />;
        case 'general-settings':
        default:
          return <UnifiedConfigurationDashboard />;
      }
    }

    if (activeModuleId === 'inicio') {
      return <AdminInicioDashboard />;
    }

    if (activeModuleId === 'saludos') {
      return <SaludosPage />;
    }

    if (activeModuleId === 'clientes') {
      return <ClientesPage />;
    }

    if (activeModuleId === 'calendario') {
      return <CalendarioPage />;
    }

    if (activeModuleId === 'facturacion') {
      return <FacturacionPage />;
    }

    return <UnifiedConfigurationDashboard />;
  };

  return (
    <main className="flex-1 h-full flex flex-col relative overflow-hidden bg-[#0b141a] text-white select-none">
      {/* HEADER SUPERIOR DEL PANEL 3 */}
      <header
        className="h-16 px-6 flex items-center justify-between border-b shrink-0 z-20"
        style={{
          backgroundColor: WHATSAPP_TOKENS.colors.panelHeader,
          borderColor: WHATSAPP_TOKENS.colors.borderSubtle,
        }}
      >
        <div>
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            {activeModuleId.toUpperCase()} — {activeSubModuleId.replace('-', ' ').toUpperCase()}
          </h2>
          <p className="text-[10px] text-[#8696a0]">
            Módulo activo dentro de la arquitectura unificada de 3 paneles WhatsApp Desktop
          </p>
        </div>
      </header>

      {/* VIEWPORT CONTENEDOR PRINCIPAL EN PANEL 3 */}
      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-[#0b141a]">
        {renderContent()}
      </div>
    </main>
  );
}
