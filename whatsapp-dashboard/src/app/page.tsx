'use client';

import React from 'react';
import Link from 'next/link';
import { Bot, LogIn, Eye, ArrowRight, ShieldCheck, Cpu, Sparkles } from 'lucide-react';
import { ChatEngineCard, IChatEngineFeature } from '../components/landing/ChatEngineCard';

const CHAT_FEATURES: readonly IChatEngineFeature[] = [
  {
    id: 'chat1Js',
    badge: 'Latencia ~0ms | $0 Tokens',
    title: 'Chat 1: Full JS (Determinista)',
    subtitle: 'Chatbot Tradicional por Menú de Opciones Múltiples',
    description: 'Funciona como un asistente estructurado por reglas locales. Guía al usuario a través de opciones numéricas o menús prediseñados sin realizar llamadas a modelos de Inteligencia Artificial.',
    keyBenefits: [
      'Respuesta instantánea (menos de 2ms)',
      'Cero costos operativos por consumo de API',
      'Precisión 100% predecible sin alucinaciones',
    ],
    iconType: 'js',
  },
  {
    id: 'chat2Hybrid',
    badge: 'Heurístico On-Demand',
    title: 'Chat 2: Motor Híbrido',
    subtitle: 'Flujo Tradicional con Invocación de IA Bajo Demanda',
    description: 'Mantiene la misma estructura del Chat 1 para la navegación por menús generales. Si la persona realiza una pregunta compleja o abierta fuera del menú, activa automáticamente la IA para responder.',
    keyBenefits: [
      'Ahorro de hasta 80% en costos de API',
      'Atención rápida para solicitudes repetitivas',
      'Flexibilidad conversacional ante dudas complejas',
    ],
    iconType: 'hybrid',
  },
  {
    id: 'chat3FullAi',
    badge: 'Contexto RAG + Caveman',
    title: 'Chat 3: Full IA Generativa',
    subtitle: 'Conversación Natural Continua con Respaldo Documental',
    description: 'Ofrece una interacción fluida en lenguaje natural basada estrictamente en la documentación corporativa inyectada. Si el caso supera el alcance o requiere intervención humana, deriva al usuario a WhatsApp.',
    keyBenefits: [
      'Compresión Caveman (ahorro ~40% en entrada)',
      'Memoria de historia con resumen progresivo',
      'Derivación transparente hacia asesores reales',
    ],
    humanEscalationText: 'Redirecciona automáticamente a WhatsApp especificando el canal oficial para que un agente real tome el control.',
    iconType: 'ai',
  },
];

/**
 * Landing Page de presentación del proyecto ProChat.
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0b0c0d] text-zinc-100 flex flex-col font-sans select-none">
      
      {/* BARRA DE NAVEGACIÓN SUPERIOR */}
      <nav className="border-b border-white/10 bg-[#141517]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Bot size={24} />
            </div>
            <div>
              <span className="font-black text-sm uppercase tracking-wider text-white block">ProChat Multi-Engine</span>
              <span className="text-[10px] text-zinc-400 block font-mono">Plataforma Conversacional v2.0</span>
            </div>
          </div>

          {/* BOTONES DE ACCIÓN PRINCIPALES */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-all flex items-center gap-2 cursor-pointer"
            >
              <LogIn size={14} /> Iniciar Sesión
            </Link>
            <Link
              href="/muestra"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/30 cursor-pointer"
            >
              <Eye size={14} /> Explorar muestras
            </Link>
          </div>
        </div>
      </nav>

      {/* SECCIÓN HERO PRINCIPAL */}
      <header className="max-w-7xl mx-auto px-6 pt-16 pb-12 text-center relative">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-6">
          <Sparkles size={14} /> Arquitectura Hexagonal & Multi-Engine Simultáneo
        </div>

        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase leading-tight max-w-4xl mx-auto mb-6">
          Ecosistema Inteligente de Atención Conversacional Multi-Motor
        </h1>

        <p className="text-zinc-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed mb-8">
          ProChat combina la inmediatez de la lógica determinista en JavaScript con la capacidad predictiva de los modelos generativos de IA, optimizando costos financieros y garantizando atención fluida 24/7.
        </p>

        {/* ACCIONES CTA CENTRALES */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/muestra"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-900/40 cursor-pointer"
          >
            <Eye size={16} /> Explorar muestras <ArrowRight size={16} />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#1c1e21] border border-white/10 hover:border-white/20 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn size={16} /> Acceder al Panel Administrativo
          </Link>
        </div>
      </header>

      {/* REJILLA DE EXPLICACIÓN DE LOS 3 MOTORES */}
      <section className="max-w-7xl mx-auto px-6 py-12 w-full flex-1">
        <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-lg font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <Cpu className="text-emerald-400" size={20} /> Los 3 Motores Conversacionales
            </h2>
            <p className="text-xs text-zinc-400 mt-1">Conoce cómo trabaja cada chatbot para maximizar la eficiencia y reducir costos</p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            Integración Multi-Tenant
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CHAT_FEATURES.map((feat) => (
            <ChatEngineCard key={feat.id} feature={feat} />
          ))}
        </div>
      </section>

      {/* PIE DE PÁGINA INFORMATIVO */}
      <footer className="border-t border-white/10 bg-[#141517] py-6 px-6 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span>ProChat Enterprise Platform v2.0 — Cifrado AES-256-GCM & Socket.io Realtime</span>
          </div>
          <span>Desarrollado bajo Arquitectura Limpia y Principios SOLID</span>
        </div>
      </footer>

    </div>
  );
}
