'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, MoreVertical, CheckCheck } from 'lucide-react';
import { useWhatsAppLayoutStore, EngineType } from '../../../application/store/useWhatsAppLayoutStore';
import { UserRole } from '../../../application/config/navigationConfig';
import { WHATSAPP_TOKENS } from '../../../theme/designTokens';

export function ChatListPanel({ userRole }: { readonly userRole: UserRole }) {
  const {
    activeChatId,
    activeFilter,
    chatSearchQuery,
    isCreateChatModalOpen,
    setActiveChat,
    setActiveFilter,
    setChatSearchQuery,
    setCreateChatModalOpen,
    createNewChatSession,
    getFilteredSessionsForRole,
  } = useWhatsAppLayoutStore();

  const [newChatName, setNewChatName] = useState('');
  const [selectedEngine, setSelectedEngine] = useState<EngineType>('HYBRID');

  const filteredSessions = getFilteredSessionsForRole(userRole);

  // Auto-seleccionar un chat permitido para el rol actual si el chat activo no está autorizado
  useEffect(() => {
    const isCurrentAllowed = filteredSessions.some((s) => s.id === activeChatId);
    if (!isCurrentAllowed && filteredSessions.length > 0) {
      setActiveChat(filteredSessions[0].id);
    }
  }, [userRole, activeChatId, filteredSessions, setActiveChat]);

  const handleCreateChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatName.trim()) return;
    createNewChatSession(newChatName.trim(), selectedEngine);
    setNewChatName('');
  };

  return (
    <section
      className="w-72 lg:w-80 h-full flex flex-col border-r shrink-0 select-none"
      style={{
        backgroundColor: WHATSAPP_TOKENS.colors.sidebarBackground,
        borderColor: WHATSAPP_TOKENS.colors.borderSubtle,
      }}
    >
      {/* HEADER DEL PANEL 2 */}
      <div className="h-16 px-4 flex items-center justify-between shrink-0">
        <h1 className="text-xl font-bold text-white tracking-tight">Chats</h1>

        <div className="flex items-center gap-1 text-[#8696a0]">
          <button
            onClick={() => setCreateChatModalOpen(true)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            title="Crear nuevo chat de prueba"
          >
            <Plus size={20} />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA DEL PANEL 2 */}
      <div className="px-3 pb-2">
        <div
          className="flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs"
          style={{ backgroundColor: WHATSAPP_TOKENS.colors.panelHeader }}
        >
          <Search size={16} className="text-[#8696a0]" />
          <input
            type="text"
            value={chatSearchQuery}
            onChange={(e) => setChatSearchQuery(e.target.value)}
            placeholder="Buscar un chat o iniciar uno nuevo"
            className="bg-transparent border-none focus:outline-none text-xs text-white w-full placeholder-[#8696a0]"
          />
        </div>
      </div>

      {/* CHIPS DE FILTRADO (TODOS, NO LEÍDOS, FAVORITOS) */}
      <div className="px-3 py-2 flex items-center gap-2 border-b shrink-0" style={{ borderColor: WHATSAPP_TOKENS.colors.borderSubtle }}>
        {(['ALL', 'UNREAD', 'FAVORITES'] as const).map((chip) => (
          <button
            key={chip}
            onClick={() => setActiveFilter(chip)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeFilter === chip
                ? 'bg-[#00a884]/20 text-[#00a884] border border-[#00a884]/40'
                : 'bg-[#202c33] text-[#8696a0] hover:bg-white/10 hover:text-white'
            }`}
          >
            {chip === 'ALL' ? 'Todos' : chip === 'UNREAD' ? 'No leídos' : 'Favoritos'}
          </button>
        ))}
      </div>

      {/* LISTA DESPLEGABLE DE CHATS (AISLADOS POR ROL) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredSessions.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#8696a0]">
            No se encontraron chats autorizados para este rol.
          </div>
        ) : (
          filteredSessions.map((session) => {
            const isActive = session.id === activeChatId;

            return (
              <div
                key={session.id}
                onClick={() => setActiveChat(session.id)}
                className={`flex items-center gap-3 px-3 py-3 border-b cursor-pointer transition-colors ${
                  isActive ? 'bg-[#2a3942]/60' : 'hover:bg-[#202c33]/40'
                }`}
                style={{ borderColor: WHATSAPP_TOKENS.colors.borderSubtle }}
              >
                <img src={session.avatar} alt={session.name} className="w-12 h-12 rounded-full object-cover shrink-0" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xs font-bold text-white truncate">{session.name}</h3>
                    <span className="text-[10px] text-[#8696a0] shrink-0">{session.timestamp}</span>
                  </div>

                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1 min-w-0">
                      <CheckCheck size={14} className="text-[#53bdeb] shrink-0" />
                      <p className="text-[11px] text-[#8696a0] truncate">{session.lastMessage}</p>
                    </div>

                    <span
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-extrabold shrink-0"
                      style={{
                        backgroundColor:
                          session.engineType === 'FULL_JS'
                            ? 'rgba(96, 165, 250, 0.15)'
                            : session.engineType === 'HYBRID'
                            ? 'rgba(251, 191, 36, 0.15)'
                            : session.engineType === 'FULL_AI'
                            ? 'rgba(192, 132, 252, 0.15)'
                            : 'rgba(16, 185, 129, 0.15)',
                        color:
                          session.engineType === 'FULL_JS'
                            ? WHATSAPP_TOKENS.colors.engineJs
                            : session.engineType === 'HYBRID'
                            ? WHATSAPP_TOKENS.colors.engineHybrid
                            : session.engineType === 'FULL_AI'
                            ? WHATSAPP_TOKENS.colors.engineAi
                            : WHATSAPP_TOKENS.colors.engineQuad,
                      }}
                    >
                      {session.engineType === 'QUAD_SIMULTANEOUS' ? 'QUAD 4-CHATS' : session.engineType}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL DE CREACIÓN DE NUEVO CHAT DE PRUEBA */}
      {isCreateChatModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141517] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4 text-white">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#00a884]">
              Crear Nuevo Chat de Prueba
            </h2>

            <form onSubmit={handleCreateChat} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Nombre del Chat / Cliente:</label>
                <input
                  type="text"
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
                  placeholder="Ej: Cliente 5 - Consulta Tarifas"
                  required
                  className="w-full bg-[#202c33] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Motor Conversacional Asignado:</label>
                <select
                  value={selectedEngine}
                  onChange={(e) => setSelectedEngine(e.target.value as EngineType)}
                  className="w-full bg-[#202c33] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-medium"
                >
                  {userRole === 'DEVELOPER' && <option value="QUAD_SIMULTANEOUS">Cuarto Chat (Quad Simultáneo)</option>}
                  {(userRole === 'DEVELOPER' || userRole === 'USER_FULL_JS') && <option value="FULL_JS">Chat 1: Full JS (Determinista)</option>}
                  {(userRole === 'DEVELOPER' || userRole === 'USER_HYBRID') && <option value="HYBRID">Chat 2: Híbrido (JS + IA On-Demand)</option>}
                  {(userRole === 'DEVELOPER' || userRole === 'USER_FULL_AI') && <option value="FULL_AI">Chat 3: Full IA (Generativo + RAG)</option>}
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setCreateChatModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl text-xs font-bold hover:bg-zinc-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00a884] hover:bg-[#008f70] text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Crear Chat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
