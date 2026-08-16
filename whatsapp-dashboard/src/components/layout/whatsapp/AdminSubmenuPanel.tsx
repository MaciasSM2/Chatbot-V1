'use client';

import React from 'react';
import {
  Sliders,
  Paintbrush,
  KeyRound,
  DollarSign,
  Code2,
  Users,
  LayoutDashboard,
  Activity,
  FileText,
  MessageCircle,
  Clock,
  HelpCircle,
  FolderOpen,
  RefreshCw,
  Calendar,
  Receipt,
} from 'lucide-react';
import { useWhatsAppLayoutStore } from '../../../application/store/useWhatsAppLayoutStore';
import { WHATSAPP_TOKENS } from '../../../theme/designTokens';

export interface ISubModuleConfig {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly icon: React.ReactNode;
}

const SECTION_SUBMODULES: Record<string, { readonly title: string; readonly items: readonly ISubModuleConfig[] }> = {
  configuraciones: {
    title: 'Consola de Configuración',
    items: [
      {
        id: 'general-settings',
        label: 'Parametrización General',
        description: 'Tono de marca, nombre del bot y operador',
        icon: <Sliders size={18} />,
      },
      {
        id: 'brand-identity',
        label: 'Identidad Visual',
        description: 'Paleta de colores, avatar y tema visual',
        icon: <Paintbrush size={18} />,
      },
      {
        id: 'api-keys',
        label: 'Llaves de API / IA',
        description: 'Configuración segura de OpenAI y modelos',
        icon: <KeyRound size={18} />,
      },
      {
        id: 'quota-limits',
        label: 'Límites de Cuotas (USD)',
        description: 'Presupuesto diario y conmutación automática',
        icon: <DollarSign size={18} />,
      },
      {
        id: 'embed-widget',
        label: 'Widget Embebible',
        description: 'Script generable para sitios web externos',
        icon: <Code2 size={18} />,
      },
      {
        id: 'user-management',
        label: 'Gestión de Usuarios y Roles',
        description: 'Control perimetral de acceso RBAC',
        icon: <Users size={18} />,
      },
    ],
  },
  inicio: {
    title: 'Panel General de Control',
    items: [
      {
        id: 'general-metrics',
        label: 'Métricas de Rendimiento',
        description: 'Resumen consolidado de interacciones',
        icon: <LayoutDashboard size={18} />,
      },
      {
        id: 'queue-monitoring',
        label: 'Monitoreo de Colas BullMQ',
        description: 'Telemetría de workers y jobs',
        icon: <Activity size={18} />,
      },
      {
        id: 'audit-logs',
        label: 'Logs de Auditoría',
        description: 'Registro cronológico de acciones de sistema',
        icon: <FileText size={18} />,
      },
    ],
  },
  saludos: {
    title: 'Módulo de Saludos y Reglas',
    items: [
      {
        id: 'welcome-templates',
        label: 'Plantillas de Bienvenida',
        description: 'Mensajes de entrada y respuestas de saludo',
        icon: <MessageCircle size={18} />,
      },
      {
        id: 'working-hours',
        label: 'Horarios de Atención',
        description: 'Ventanas temporales y fueras de servicio',
        icon: <Clock size={18} />,
      },
      {
        id: 'faqs-rules',
        label: 'Respuestas Frecuentes (FAQs)',
        description: 'Árboles deterministas de consulta rápida',
        icon: <HelpCircle size={18} />,
      },
    ],
  },
  clientes: {
    title: 'Directorio CRM de Clientes',
    items: [
      {
        id: 'crm-directory',
        label: 'Directorio de Clientes',
        description: 'Búsqueda, edición y clasificación de clientes',
        icon: <FolderOpen size={18} />,
      },
      {
        id: 'rut-sync',
        label: 'Sincronización RUT',
        description: 'Carga masiva y parseo de registros fiscales',
        icon: <RefreshCw size={18} />,
      },
    ],
  },
  calendario: {
    title: 'Calendario y Excepciones',
    items: [
      {
        id: 'exemptions',
        label: 'Días Festivos y Excepciones',
        description: 'Fechas no laborales y ventanas especiales',
        icon: <Calendar size={18} />,
      },
    ],
  },
  facturacion: {
    title: 'Facturación y Consumo',
    items: [
      {
        id: 'invoices',
        label: 'Facturas Emitidas',
        description: 'Historial transaccional y comprobantes',
        icon: <Receipt size={18} />,
      },
      {
        id: 'token-consumption',
        label: 'Consumo de Tokens y USD',
        description: 'Desglose financiero por motor conversacional',
        icon: <DollarSign size={18} />,
      },
    ],
  },
};

export function AdminSubmenuPanel() {
  const { activeModuleId, activeSubModuleId, setActiveSubModule } = useWhatsAppLayoutStore();

  const sectionConfig = SECTION_SUBMODULES[activeModuleId] || SECTION_SUBMODULES.configuraciones;

  return (
    <section
      className="w-80 md:w-96 h-full flex flex-col border-r shrink-0 select-none"
      style={{
        backgroundColor: WHATSAPP_TOKENS.colors.sidebarBackground,
        borderColor: WHATSAPP_TOKENS.colors.borderSubtle,
      }}
    >
      {/* HEADER DEL PANEL 2 PARA SECCIÓN ADMINISTRATIVA */}
      <div
        className="h-16 px-4 flex items-center justify-between border-b shrink-0"
        style={{
          backgroundColor: WHATSAPP_TOKENS.colors.panelHeader,
          borderColor: WHATSAPP_TOKENS.colors.borderSubtle,
        }}
      >
        <h2 className="text-sm font-black uppercase tracking-wider text-white truncate">
          {sectionConfig.title}
        </h2>
      </div>

      {/* LISTA DE SUBMÓDULOS DE NAVEGACIÓN EN PANEL 2 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
        {sectionConfig.items.map((sub) => {
          const isActive = activeSubModuleId === sub.id;

          return (
            <div
              key={sub.id}
              onClick={() => setActiveSubModule(sub.id)}
              className={`p-3 rounded-xl cursor-pointer transition-all flex items-start gap-3 border ${
                isActive
                  ? 'bg-[#2a3942] border-[#00a884]/40 shadow-lg'
                  : 'bg-transparent border-transparent hover:bg-[#202c33]/60'
              }`}
            >
              <div
                className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                  isActive ? 'bg-[#00a884]/20 text-[#00a884]' : 'bg-[#202c33] text-[#8696a0]'
                }`}
              >
                {sub.icon}
              </div>

              <div className="flex-1 min-w-0">
                <h3
                  className={`text-xs font-bold truncate ${
                    isActive ? 'text-[#00a884]' : 'text-white'
                  }`}
                >
                  {sub.label}
                </h3>
                <p className="text-[11px] text-[#8696a0] line-clamp-2 mt-0.5 leading-snug">
                  {sub.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
