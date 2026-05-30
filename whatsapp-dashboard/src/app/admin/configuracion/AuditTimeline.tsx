import React from 'react';
import { ShieldAlert } from 'lucide-react';

export interface AuditLog {
  id: number;
  module_id: string;
  module_name: string;
  action: 'ACTIVATED' | 'DEACTIVATED';
  admin_name: string;
  previous_state: boolean;
  new_state: boolean;
  created_at: string;
}

export interface AuditTimelineProps {
  logs: AuditLog[];
}

export const AuditTimeline: React.FC<AuditTimelineProps> = ({ logs }) => (
  <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm mt-6">
    <div className="p-4 bg-gray-50 border-b border-gray-100 font-bold text-gray-700 flex justify-between">
      <span>Historial de Auditoría</span>
      <span className="text-[10px] text-indigo-600 uppercase tracking-widest">Logs en Tiempo Real</span>
    </div>
    
    <div className="divide-y divide-gray-50">
      {logs && logs.map((log) => (
        <div key={log.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-full ${log.action === 'ACTIVATED' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
              <ShieldAlert size={16} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">{log.module_name}</p>
              <p className="text-[10px] text-gray-500">
                {new Date(log.created_at).toLocaleString('es-CO', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true
                })}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-gray-600 flex items-center justify-end gap-1">
              {log.admin_name}
            </p>
            <p className={`text-[9px] font-black uppercase ${log.action === 'ACTIVATED' ? 'text-emerald-500' : 'text-rose-500'}`}>
              {log.action === 'ACTIVATED' ? 'ACTIVADO' : 'DESACTIVADO'}
            </p>
          </div>
        </div>
      ))}

      {(!logs || logs.length === 0) && (
        <div className="p-8 text-center text-gray-450 text-xs italic">
          No se han registrado movimientos de auditoría aún en el sistema.
        </div>
      )}
    </div>
  </div>
);
