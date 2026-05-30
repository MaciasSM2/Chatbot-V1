'use client';

import React, { useEffect, useState } from 'react';
import { useModuleStore } from '../../../application/store/useModuleStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Activity, Users, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function InicioPage() {
  const { isModuleEnabled, loadModules } = useModuleStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setIsMounted(true);
      loadModules();
    }, 0);
  }, [loadModules]);

  useEffect(() => {
    if (!isModuleEnabled('dashboard_home')) {
      setTimeout(() => {
        setLoading(false);
      }, 0);
      return;
    }

    const fetchStats = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
        const response = await fetch(`${baseUrl}/stats`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isModuleEnabled]);

  if (!isMounted) return null;

  // Si el módulo está apagado, mostramos bloqueo visual
  if (!isModuleEnabled('dashboard_home')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
        <Activity size={48} className="text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-500">Módulo de Analíticas Desactivado</h2>
        <p className="text-sm text-gray-400">Activa este módulo en Configuración para ver las métricas.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Cargando métricas...</div>;
  }

  return (
    <div className="p-8 space-y-8 animate-fadeIn">
      {/* KPIs Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Conversaciones Activas</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">
                {stats?.history?.reduce((acc: number, curr: any) => acc + parseInt(curr.bot_msgs), 0) || '0'}
              </h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl"><Users size={20}/></div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Alertas</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">
                {stats?.errors?.find((e: any) => e.status !== 'delivered' && e.status !== 'read')?.count || '0'}
              </h3>
            </div>
            <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl"><AlertTriangle size={20}/></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Salud Meta API</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">100%</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl"><ShieldCheck size={20}/></div>
          </div>
        </div>
      </div>

      {/* Gráfica Principal de Tráfico de WhatsApp */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Activity size={16} className="text-indigo-500" /> Tráfico Semanal (Mensajes Bot vs Usuario)
        </h3>
        <div className="h-72 w-full">
          {isMounted && stats?.history ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.history}>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <YAxis hide />
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Line type="monotone" dataKey="bot_msgs" stroke="#6366f1" strokeWidth={4} dot={false} />
                <Line type="monotone" dataKey="user_msgs" stroke="#10b981" strokeWidth={4} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">Esperando datos de la API...</div>
          )}
        </div>
      </div>
    </div>
  );
}
