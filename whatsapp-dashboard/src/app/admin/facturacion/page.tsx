'use client';

import React, { useEffect, useState } from 'react';
import { FileText, MapPin, Calendar, RefreshCw } from 'lucide-react';
import { getApiUrl, executeSecureRequest } from '../../../core/apiClient';

interface Invoice {
  id: number;
  clientPhone: string;
  documentType: 'CC' | 'NIT' | 'CE' | 'PPX';
  documentNumber: string;
  clientName: string;
  origin: string;
  destination: string;
  baseCost: number;
  taxAmount: number;
  totalCost: number;
  createdAt: string;
}

export default function FacturacionAdminPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const result = await executeSecureRequest(`${getApiUrl()}/billing/invoices`);
      if (result.success) setInvoices(result.data);
    } catch (error) {
      console.error('Error cargando historial de liquidaciones:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  return (
    <div className="space-y-8 p-1 animate-in fade-in duration-300">
      
      {/* Encabezado del Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-subtle">
        <div>
          <h2 className="text-xl font-black text-text-main uppercase tracking-tight flex items-center gap-2">
            <FileText className="text-brand-primary" size={20} />
            Auditoría de Liquidaciones SICE-TAC
          </h2>
          <p className="text-xs text-text-muted mt-1">Historial transaccional de órdenes liquidadas por el asistente de Inteligencia Artificial.</p>
        </div>
        <button 
          onClick={fetchInvoices}
          className="flex items-center justify-center gap-2 bg-background-panel border border-border-subtle hover:border-brand-primary/40 text-text-main text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          Actualizar Base
        </button>
      </div>

      {/* Tabla Operativa Estilo Terminal / Deep Black */}
      <div className="bg-background-panel border border-border-subtle rounded-[2rem] overflow-hidden shadow-2xl shadow-black/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-background-header border-b border-border-subtle text-[10px] font-black text-text-muted uppercase tracking-widest">
                <th className="py-4 px-6">ID / Fecha</th>
                <th className="py-4 px-6">Razón Social / Teléfono</th>
                <th className="py-4 px-6">Identificación</th>
                <th className="py-4 px-6">Trayecto (Ruta)</th>
                <th className="py-4 px-6 text-right">Liquidación Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-xs text-text-main">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center font-mono text-brand-primary animate-pulse">
                    &gt; Consultando registros relacionales de MariaDB...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center font-mono text-text-muted italic opacity-50">
                    &gt; No se registran órdenes de liquidación en el periodo actual.
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-background-header/50 transition-colors group">
                    {/* ID y Fecha */}
                    <td className="py-4 px-6 space-y-1">
                      <span className="font-mono font-bold text-brand-primary">#ST-{invoice.id}</span>
                      <div className="text-[10px] text-text-muted flex items-center gap-1">
                        <Calendar size={10} />
                        {new Date(invoice.createdAt).toLocaleDateString('co')}
                      </div>
                    </td>
                    {/* Cliente */}
                    <td className="py-4 px-6">
                      <div className="font-bold tracking-tight">{invoice.clientName}</div>
                      <div className="text-[10px] text-text-muted font-mono mt-0.5">{invoice.clientPhone}</div>
                    </td>
                    {/* Identificación con Badge Semántico */}
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black border tracking-wider mr-2 ${
                        invoice.documentType === 'NIT' 
                          ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/20' 
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {invoice.documentType}
                      </span>
                      <span className="font-mono font-medium">{invoice.documentNumber}</span>
                    </td>
                    {/* Ruta */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 font-bold text-[11px] tracking-wide">
                        <span>{invoice.origin}</span>
                        <span className="text-brand-primary text-xs group-hover:translate-x-0.5 transition-transform">➔</span>
                        <span className="text-text-muted group-hover:text-text-main transition-colors">{invoice.destination}</span>
                      </div>
                      <div className="text-[9px] text-text-muted uppercase tracking-widest mt-0.5 flex items-center gap-1">
                        <MapPin size={10} /> SICE-TAC Verificado
                      </div>
                    </td>
                    {/* Costo Total */}
                    <td className="py-4 px-6 text-right font-mono font-bold text-sm text-text-main">
                      <div className="text-text-main">${Number(invoice.totalCost).toLocaleString('co')}</div>
                      <div className="text-[9px] text-text-muted font-normal">IVA incluido (0%)</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
