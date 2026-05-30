'use client';

import React, { useEffect, useState } from 'react';
import { useChatStore } from '../application/store/useChatStore';
import { ChatWindow } from '../presentation/components/chat/ChatWindow';
import { SidebarSearch } from '../presentation/components/chat/SidebarSearch';
import { Settings, MessageSquare, Users, ShieldAlert, Sparkles, MessageCircle, Plus, X, Phone, Calendar, FlaskConical } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const { activeChats, loadActiveChats, activeChatId, setActiveChat, sendMessage, isLoadingActive, isFullScreen, setIsConfiguring } = useChatStore();
  const [search, setSearch] = useState('');
  
  // Estados para nuevo chat
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPhone, setNewPhone] = useState('');

  const handleStartChat = async (e) => {
    if (e) e.preventDefault();
    if (!newPhone.trim()) return;
    
    const formattedPhone = newPhone.trim();
    setActiveChat(formattedPhone);
    setIsCreateModalOpen(false);
    
    // Inicializar la sesión en el backend enviando el mensaje inicial
    await sendMessage("¡Hola! Iniciando chat manual."); 
    setNewPhone('');
    loadActiveChats();
  };

  // Carga inicial de chats activos e intercepción de chat pendiente externo
  useEffect(() => {
    loadActiveChats();
    
    const pendingChat = localStorage.getItem('pending_chat');
    if (pendingChat) {
      setActiveChat(pendingChat);
      localStorage.removeItem('pending_chat');
    }
  }, [loadActiveChats, setActiveChat]);

  // Filtrado por buscador
  const filteredChats = activeChats.filter(chat => {
    const nameMatch = (chat.clientName || '').toLowerCase().includes(search.toLowerCase());
    const phoneMatch = chat.userId.toLowerCase().includes(search.toLowerCase());
    return nameMatch || phoneMatch;
  });

  // Formateador de fechas
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <main className="h-screen w-screen bg-[#0b141a] flex overflow-hidden font-sans select-none">
      <div className="flex w-full h-full overflow-hidden">
        
        {/* Barra de Navegación Vertical Estilo WhatsApp (Extremo Izquierdo) */}
        {!isFullScreen && (
          <div className="flex flex-col w-[64px] bg-[#202c33] border-r border-white/5 items-center py-4 justify-between shrink-0 text-slate-400 select-none">
            {/* Sección Superior: Logo e Íconos de Sección */}
            <div className="flex flex-col items-center gap-6 w-full">
              {/* Avatar / Identificador */}
              <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center border border-white/10 shrink-0">
                <img src="https://api.dicebear.com/7.x/adventurer/svg?seed=Admin" alt="Admin Avatar" className="w-9 h-9" />
              </div>

              {/* Íconos de Navegación */}
              <div className="flex flex-col items-center gap-4 w-full px-2">
                {/* Chats (Activo) */}
                <button 
                  className="p-3 bg-[#374248] text-[#00a884] rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer"
                  title="Chats Activos (Simulador)"
                >
                  <MessageSquare size={20} />
                </button>

                {/* Clientes */}
                <Link 
                  href="/admin/clientes"
                  className="p-3 hover:bg-[#374248] hover:text-slate-200 text-slate-400 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer"
                  title="Administración de Clientes"
                >
                  <Users size={20} />
                </Link>

                {/* Saludos Smart */}
                <Link 
                  href="/admin/saludos"
                  className="p-3 hover:bg-[#374248] hover:text-slate-200 text-slate-400 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer"
                  title="Configuración de Saludos"
                >
                  <MessageCircle size={20} />
                </Link>

                {/* Calendario */}
                <Link 
                  href="/admin/calendario"
                  className="p-3 hover:bg-[#374248] hover:text-slate-200 text-slate-400 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer"
                  title="Calendario y Festivos"
                >
                  <Calendar size={20} />
                </Link>
              </div>
            </div>

            {/* Sección Inferior: Configuración */}
            <div className="flex flex-col items-center gap-4 w-full">
              <Link 
                href="/admin/configuracion"
                className="p-3 hover:bg-[#374248] hover:text-slate-200 text-slate-400 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer"
                title="Configuración de Módulos"
              >
                <Settings size={20} />
              </Link>
            </div>
          </div>
        )}

        {/* Sidebar Lateral de Chats Activos */}
        {!isFullScreen && (
          <div className="flex flex-col w-[350px] bg-[#111b21] border-r border-white/5 text-white shrink-0">
            {/* Header del Sidebar */}
            <div className="p-4 bg-[#111b21] border-b border-white/5 flex items-center justify-between">
              <div>
                <h1 className="text-lg font-extrabold tracking-wide flex items-center gap-2 text-slate-100 uppercase">
                  <Sparkles className="text-[#00a884]" size={18} />
                  Chats
                </h1>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Simulador Activo</p>
              </div>
              
              <div className="flex items-center gap-2">
                {/* BOTÓN DE TEST (NUEVO FLASK CONICAL) */}
                <button 
                  onClick={() => {
                    if (!activeChatId) {
                      setActiveChat('TEST_BOT_DEBUG');
                    }
                    setIsConfiguring(true);
                  }}
                  className="p-2 bg-[#202c33] hover:bg-[#374248] text-emerald-400 hover:text-emerald-300 rounded-xl transition-all shadow-md cursor-pointer relative group"
                  title="Ejecutar Test de Chatbot (Matraz)"
                >
                  <FlaskConical size={16} className="group-active:scale-90 transition-transform" />
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 select-none pointer-events-none">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                </button>

                <Link 
                  href="/admin/configuracion" 
                  className="p-2 bg-[#202c33] hover:bg-[#374248] text-slate-400 hover:text-white rounded-xl transition-all shadow-md cursor-pointer"
                  title="Configuración de Módulos"
                >
                  <Settings size={16} />
                </Link>
              </div>
            </div>

            {/* Buscador de Chats Global */}
            <SidebarSearch 
              onLocalSearch={setSearch} 
              action={
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="p-2.5 bg-[#005c4b] hover:bg-[#00755f] text-white rounded-xl transition-all shadow-md shrink-0 flex items-center justify-center cursor-pointer active:scale-95 border border-[#00755f]/30"
                  title="Nuevo Chat"
                >
                  <Plus size={18} />
                </button>
              }
            />
            
            {/* Lista de Chats Activos */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 custom-scrollbar bg-[#111b21]">
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 px-2.5 mb-1.5">
                Chats Activos
              </div>

              {isLoadingActive && activeChats.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs font-semibold uppercase tracking-wider animate-pulse">
                  Cargando...
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs font-medium px-4 leading-normal">
                  No hay chats activos. {search ? 'Intenta otra búsqueda.' : 'Inicia un chat de depuración.'}
                </div>
              ) : (
                filteredChats.map((chat) => {
                  const isActive = activeChatId === chat.userId;
                  return (
                    <div
                      key={chat.userId}
                      onClick={() => setActiveChat(chat.userId)}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 select-none ${
                        isActive 
                          ? 'bg-[#2a3942] text-white border border-[#374248]' 
                          : 'bg-transparent hover:bg-[#202c33] text-slate-300 border border-transparent'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="w-11 h-11 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden border border-white/5 shrink-0">
                        <img 
                          src={`https://api.dicebear.com/7.x/identicon/svg?seed=${chat.userId}`} 
                          alt="User Identicon" 
                          className="w-9 h-9" 
                        />
                      </div>

                      {/* Información del Chat */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline gap-1">
                          <h4 className="font-bold text-sm truncate text-slate-100">
                            {chat.clientName || chat.userId}
                          </h4>
                          <span className={`text-[10px] shrink-0 font-medium ${isActive ? 'text-[#00a884]' : 'text-slate-500'}`}>
                            {formatTime(chat.lastMessageTime)}
                          </span>
                        </div>
                        <p className="text-xs truncate mt-0.5 text-slate-400">
                          {chat.lastMessageText || 'Sin mensajes'}
                        </p>
                        
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${
                            chat.isRegistered 
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                              : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                          }`}>
                            {chat.isRegistered ? 'REGISTRADO' : 'NUEVO'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Panel del Chat / Simulador Activo */}
        <div className="flex-1 h-full bg-[#222e35] relative flex flex-col items-center justify-center">
          {activeChatId ? (
            <div className="w-full h-full flex items-center justify-center bg-transparent">
              <ChatWindow chatId={activeChatId} />
            </div>
          ) : (
            <div className="text-center p-8 space-y-4 max-w-sm">
              <div className="w-16 h-16 bg-[#202c33] border border-white/5 rounded-2xl flex items-center justify-center mx-auto shadow-md">
                <MessageCircle size={32} className="text-[#00a884]" />
              </div>
              <h3 className="text-lg font-bold text-slate-100">WhatsApp Bot Pro</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Selecciona una conversación activa de la lista de la izquierda para abrir el simulador e interactuar con el ChatBot.
              </p>
              <div className="pt-2 text-[9px] text-slate-500 uppercase tracking-widest font-black font-mono">
                PostgreSQL + WebSockets + Redis
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Nuevo Chat Flotante */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-fadeIn text-slate-100">
            
            {/* Header del Modal */}
            <div className="bg-slate-950 p-6 flex justify-between items-center border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <MessageCircle size={20} className="text-blue-400" />
                  Iniciar Nuevo Chat
                </h3>
                <p className="text-xs text-slate-400 mt-1">Ingresa el número de teléfono del cliente.</p>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-slate-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Formulario del Modal */}
            <form onSubmit={handleStartChat} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Número de Teléfono / Identificador
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Phone size={16} />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Ej. +5215512345678 o TEST_BOT_DEBUG"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all text-slate-100 font-semibold"
                    autoFocus
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                  Tip: Usa el identificador especial <code className="bg-slate-950 px-1 py-0.5 rounded text-blue-400 font-mono">TEST_BOT_DEBUG</code> para activar el modo de depuración de saludos.
                </p>
              </div>

              {/* Botones del Formulario */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 text-xs font-bold hover:bg-slate-800 hover:text-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/10 active:scale-95 transition-all cursor-pointer"
                >
                  Iniciar Chat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
