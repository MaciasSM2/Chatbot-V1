import React, { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../../../application/store/useChatStore';
import { useModuleStore } from '../../../application/store/useModuleStore';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { QuickRegistrationForm } from './QuickRegistrationForm';
import { TestConfigWizard } from './TestConfigWizard';
import { ChatHeader } from './ChatHeader';
import { Search, MoreVertical, Phone, Video, ArrowLeft, Shield, Moon, AlertTriangle, Trash2, Sliders, X, Maximize2, Minimize2, Cpu, ChevronUp, ChevronDown } from 'lucide-react';
import { usePushNotifications } from '../../../application/hooks/usePushNotifications';
import { useSocketEvents } from '../../../application/hooks/useSocketEvents';
import { generateInitialFrame } from '../../../application/services/SimulationService';
import { initializeSimulation } from '../../../application/services/SimulationInitializer';
import { LoadingOverlay } from './LoadingOverlay';
import { LiveDebugSidebar } from './LiveDebugSidebar';

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL_BASE || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const BASE_URL = rawApiUrl.endsWith('/api') ? rawApiUrl.slice(0, -4) : rawApiUrl;
const API_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

export const ChatWindow = ({ chatId }) => {
  const { 
    messages, 
    loadChatHistory, 
    setActiveChat, 
    sendMessage, 
    initSocket, 
    isLoading, 
    activeChats, 
    resetChat, 
    loadActiveChats, 
    highlightedMessageId, 
    setHighlightedMessageId,
    activeScenario,
    startForcedConversation,
    isFullScreen,
    toggleFullScreen,
    toggleChatPause,
    isConfiguring,
    setIsConfiguring
  } = useChatStore();
  const { modules, loadModules } = useModuleStore();
  const messagesEndRef = useRef(null);

  const [isBooting, setIsBooting] = useState(false);


  // Intentamos obtener el chat actual desde la lista de chats activos para extraer el nombre del cliente y metadatos
  const currentChat = activeChats.find(chat => chat.userId === chatId);
  const clientName = currentChat?.clientName || chatId;
  const isRegistered = currentChat?.isRegistered ?? false;
  const isPaused = currentChat?.isPaused ?? false;

  const { sendNotification } = usePushNotifications();

  // Escuchamos mensajes nuevos
  useSocketEvents(chatId, (msg) => {
    // Lógica de filtrado para notificación
    if (msg.sender === 'user') {
      // Si el mensaje contiene palabras clave o el bot pide ayuda
      const isUrgent = msg.text.toLowerCase().includes('humano') || 
                       msg.text.toLowerCase().includes('asesor') ||
                       msg.requiresHuman;

      if (isUrgent) {
        sendNotification(
          `🚨 Intervención Requerida: ${clientName || chatId}`,
          `Mensaje: ${msg.text.substring(0, 50)}...`
        );
      }
    }
  });

  const [diagnostic, setDiagnostic] = useState({ status: 'checking', database: 'checking', redis: 'checking' });
  const [isCheckingDiagnostic, setIsCheckingDiagnostic] = useState(true);
  const [isNewClient, setIsNewClient] = useState(false);
  const [gender, setGender] = useState('M');
  const [validationToken, setValidationToken] = useState('');
  const [matchStatus, setMatchStatus] = useState('');
  const [dayType, setDayType] = useState('');
  const [isNonWorkableContext, setIsNonWorkableContext] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showDebugSidebar, setShowDebugSidebar] = useState(false);
  const [showDiag, setShowDiag] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const effectiveIsNonWorkable = activeScenario ? activeScenario.isNonWorkable : isNonWorkableContext;
  const effectiveDayType = activeScenario ? activeScenario.dayType : dayType;

  const runDiagnostic = async () => {
    setIsCheckingDiagnostic(true);
    try {
      const res = await fetch(`${BASE_URL}/health`);
      const data = await res.json();
      setDiagnostic(data);
    } catch (err) {
      console.error("Error al obtener diagnóstico de salud:", err);
      setDiagnostic({ status: 'unhealthy', database: 'disconnected', redis: 'disconnected' });
    } finally {
      setIsCheckingDiagnostic(false);
    }
  };

  const handleSimulateCategory = async (category, minutes) => {
    useChatStore.setState({ isLoading: true });
    try {
      let url = `${API_URL}/test/greeting/${category}?userId=${chatId}&isNewClient=${isNewClient}&gender=${gender}`;
      if (minutes) {
        url += `&minutes=${minutes}`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error("Error en la simulación de saludos");
      const data = await response.json();
      if (data) {
        if (data.token) {
          setValidationToken(data.token);
          setMatchStatus(data.status);
        }
        if (data.dayType !== undefined) {
          setDayType(data.dayType);
          setIsNonWorkableContext(data.isNonWorkable);
        } else {
          // Reset context flags if not provided
          setDayType('');
          setIsNonWorkableContext(false);
        }
      }
    } catch (err) {
      console.error("Error simulando saludo:", err);
      useChatStore.setState({ isLoading: false });
    }
  };

  const greetingModule = modules.find(m => m.id === 'module_greetings');
  const isGreetingEnabled = greetingModule ? greetingModule.is_enabled : true;

  useEffect(() => {
    loadModules();
  }, [loadModules]);

  useEffect(() => {
    setActiveChat(chatId);
    loadChatHistory(chatId);
    initSocket(chatId); // Iniciamos la escucha en tiempo real
  }, [chatId, setActiveChat, loadChatHistory, initSocket]);

  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => {
        setIsConfiguring(messages.length === 0 && !activeScenario);
      }, 0);
    }
  }, [chatId, messages.length, activeScenario, isLoading]);

  useEffect(() => {
    setTimeout(() => {
      runDiagnostic();
    }, 0);
  }, [chatId]);



  useEffect(() => {
    if (!highlightedMessageId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, highlightedMessageId]);

  useEffect(() => {
    if (highlightedMessageId) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`msg-${highlightedMessageId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          const clearTimer = setTimeout(() => {
            setHighlightedMessageId(null);
          }, 3000);
          
          return () => clearTimeout(clearTimer);
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [highlightedMessageId, setHighlightedMessageId]);

  const handleBack = () => {
    setActiveChat(null);
  };

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex-1 h-full w-full flex flex-col items-center justify-center bg-[#0b141a] text-slate-400 select-none">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-sm font-semibold tracking-wide animate-pulse">Cargando historial...</span>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-[#0b141a] overflow-hidden relative transition-all duration-300 border-none rounded-none shadow-none">
      
      {/* 1. Área Central del Chat */}
      <div className="flex-1 flex flex-col h-full bg-transparent overflow-hidden relative border-none rounded-none shadow-none">
        
        {/* Header Premium de WhatsApp refactorizado */}
      <ChatHeader
        clientName={clientName}
        phoneNumber={chatId}
        isOnline={!isLoading}
        continuityTimer={null} /* TODO: Conectar estado real del servidor */
        isBotPaused={isPaused}
        onTogglePause={() => toggleChatPause(chatId)}
        isTyping={isLoading}
        messages={messages}
        activeScenario={activeScenario}
      >
        {/* Lado Derecho: Acciones Rápidas */}
        {chatId === 'TEST_BOT_DEBUG' && (
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-amber-500/15 border border-amber-500/20 rounded-lg text-amber-400 text-[10px] font-bold select-none mr-2">
            <Shield size={12} />
            MODO PRUEBA
          </div>
        )}
          <button 
            onClick={toggleFullScreen}
            className={`p-2 rounded-xl border transition-all duration-300 cursor-pointer active:scale-95 flex items-center justify-center mr-1 ${
              isFullScreen 
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_4px_12px_rgba(16,185,129,0.2)]'
                : 'bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 border border-slate-800 hover:border-slate-700/50 shadow-[0_2px_8px_rgba(0,0,0,0.05)]'
            }`}
            title={isFullScreen ? "Salir de pantalla completa (Modo Inmersivo)" : "Expandir área de chat (Modo Inmersivo)"}
          >
            {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          <button 
            onClick={() => setIsConfiguring(prev => !prev)}
            className={`p-2 rounded-xl border transition-all duration-300 cursor-pointer active:scale-95 flex items-center justify-center mr-1 ${
              isConfiguring 
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_4px_12px_rgba(16,185,129,0.2)]'
                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/10 hover:border-emerald-500/20 shadow-[0_2px_8px_rgba(16,185,129,0.05)] hover:shadow-[0_4px_12px_rgba(16,185,129,0.15)]'
            }`}
            title={isConfiguring ? "Cerrar configuración" : "Configurar Escenario de Prueba"}
          >
            <Sliders size={18} />
          </button>
          <button 
            onClick={() => setShowDebugSidebar(prev => !prev)}
            className={`p-2 rounded-xl border transition-all duration-300 cursor-pointer active:scale-95 flex items-center justify-center mr-1 ${
              showDebugSidebar 
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_4px_12px_rgba(16,185,129,0.2)]'
                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/10 hover:border-emerald-500/20 shadow-[0_2px_8px_rgba(16,185,129,0.05)] hover:shadow-[0_4px_12px_rgba(16,185,129,0.15)]'
            }`}
            title={showDebugSidebar ? "Ocultar Motor de Simulación" : "Ver Motor de Simulación (Debug FSM)"}
          >
            <Cpu size={18} />
          </button>
          <button 
            onClick={() => setShowResetConfirm(true)}
            className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/10 hover:border-rose-500/20 rounded-xl transition-all duration-300 cursor-pointer active:scale-95 flex items-center justify-center mr-1 shadow-[0_2px_8px_rgba(244,63,94,0.05)] hover:shadow-[0_4px_12px_rgba(244,63,94,0.15)]"
            title="Reiniciar flujo y borrar mensajes (Hard Reset)"
          >
            <Trash2 size={18} />
          </button>
          <button className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-slate-200 transition-all cursor-pointer active:scale-95" title="Iniciar llamada de voz (Simulación)">
            <Phone size={18} />
          </button>
          <button className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-slate-200 transition-all cursor-pointer active:scale-95" title="Iniciar videollamada (Simulación)">
            <Video size={18} />
          </button>
          <button className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-slate-200 transition-all cursor-pointer active:scale-95" title="Buscar en el chat">
            <Search size={18} />
          </button>
          <button className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-slate-200 transition-all cursor-pointer active:scale-95" title="Opciones">
            <MoreVertical size={18} />
          </button>
      </ChatHeader>

      {/* Acordeón Superior: Diagnóstico y Alertas */}
      {!isConfiguring && !isBooting && (
        <div className="border-b border-white/5 select-none bg-[#202c33]/30">
          <div 
            onClick={() => setShowDiag(!showDiag)}
            className="px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-[#202c33]/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full select-none tracking-wide transition-all ${
                diagnostic.status === 'healthy' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : diagnostic.status === 'checking'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold'
              }`}>
                Diagnóstico: {diagnostic.status === 'healthy' ? 'Sistema OK' : diagnostic.status === 'checking' ? 'Verificando...' : 'Sistema Crítico'}
              </span>
              {!showDiag && (
                <div className="flex gap-2.5 text-[9px] font-bold tracking-wider opacity-60 select-none">
                  <span className={diagnostic.database === 'connected' ? 'text-emerald-400' : 'text-rose-400'}>
                    Postgres: {diagnostic.database === 'connected' ? '✔' : '✘'}
                  </span>
                  <span className={diagnostic.redis === 'connected' ? 'text-emerald-400' : 'text-rose-400'}>
                    Redis: {diagnostic.redis === 'connected' ? '✔' : '✘'}
                  </span>
                  <span className={activeScenario?.apiStatus === 'ERROR_500' ? 'text-rose-400' : activeScenario?.apiStatus === 'TIMEOUT' ? 'text-amber-400' : 'text-emerald-400'}>
                    Meta: {activeScenario?.apiStatus === 'ERROR_500' ? '500' : activeScenario?.apiStatus === 'TIMEOUT' ? '⏳' : 'OK'}
                  </span>
                </div>
              )}
            </div>
            {showDiag ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
          </div>

          {/* CONTENIDO COLAPSABLE SUPERIOR */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showDiag ? 'max-h-[300px] border-t border-white/5 bg-[#182229]/80 backdrop-blur-md' : 'max-h-0'}`}>
            <div className="p-4 flex flex-col gap-2.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Detalles de servicios */}
                  <div className="flex items-center gap-2 select-none">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg border transition-all duration-300 ${
                      diagnostic.database === 'connected'
                        ? 'bg-emerald-500/5 text-emerald-400/90 border-emerald-500/10'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30 font-bold shadow-[0_0_10px_rgba(239,68,68,0.1)]'
                    }`}>
                      Postgres: {diagnostic.database === 'connected' ? '✅ OK' : '❌ ERROR'}
                    </span>

                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg border transition-all duration-300 ${
                      diagnostic.redis === 'connected'
                        ? 'bg-emerald-500/5 text-emerald-400/90 border-emerald-500/10'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30 font-bold shadow-[0_0_10px_rgba(239,68,68,0.1)]'
                    }`}>
                      Redis: {diagnostic.redis === 'connected' ? '✅ OK' : '❌ ERROR'}
                    </span>

                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg border transition-all duration-300 ${
                      activeScenario?.apiStatus === 'ERROR_500' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 font-bold shadow-[0_0_10px_rgba(239,68,68,0.1)]' :
                      activeScenario?.apiStatus === 'TIMEOUT' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 font-bold' :
                      'bg-emerald-500/5 text-emerald-400/90 border-emerald-500/10'
                    }`}>
                      Mock Meta: {activeScenario?.apiStatus === 'ERROR_500' ? '❌ ERROR 500' : activeScenario?.apiStatus === 'TIMEOUT' ? '⏳ TIMEOUT' : '✅ OK'}
                    </span>
                  </div>
                </div>

                {/* Botón Re-diagnosticar */}
                <button 
                  onClick={runDiagnostic}
                  disabled={isCheckingDiagnostic}
                  className="text-[10px] font-bold text-slate-400 hover:text-emerald-400 disabled:text-slate-600 transition-colors uppercase tracking-wider cursor-pointer active:scale-95 select-none"
                >
                  {isCheckingDiagnostic ? 'Analizando...' : '🔄 Re-Diagnosticar'}
                </button>
              </div>

              {/* Alerta Roja si Postgres o Redis está desconectado */}
              {diagnostic.status === 'unhealthy' && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg shadow-rose-950/20 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex flex-col gap-1">
                    <span className="font-extrabold flex items-center gap-1.5 text-rose-400">
                      ⚠️ ALERTA DE CONFIGURACIÓN (MODO LOCAL / DEMO ACTIVO)
                    </span>
                    <span className="text-[11px] text-rose-300/90 leading-relaxed">
                      {diagnostic.database === 'disconnected' && '• La base de datos PostgreSQL no responde o no está inicializada. El sistema opera con persistencia temporal en memoria.'}
                      {diagnostic.database === 'disconnected' && diagnostic.redis === 'disconnected' && <br />}
                      {diagnostic.redis === 'disconnected' && '• El servicio de colas y sesiones Redis está desconectado. Las colas asíncronas se simulan mediante procesamiento directo.'}
                    </span>
                  </div>
                  <button
                    onClick={runDiagnostic}
                    disabled={isCheckingDiagnostic}
                    className="shrink-0 px-4 py-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer active:scale-95 transition-all duration-300 shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:shadow-[0_0_25px_rgba(239,68,68,0.6)] animate-pulse flex items-center justify-center gap-1.5"
                  >
                    {isCheckingDiagnostic ? (
                      <>
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        REINTENTANDO...
                      </>
                    ) : (
                      '🔄 REINTENTAR CONEXIÓN'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Indicador de contexto en el simulador */}
      {effectiveIsNonWorkable && !isConfiguring && !isBooting && (
        <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-amber-500/15 border-b border-amber-500/20 py-2.5 px-4 text-center backdrop-blur-md animate-in slide-in-from-top-2 duration-300 select-none">
          <div className="max-w-md mx-auto flex items-center justify-center gap-2.5">
            <Moon className="text-amber-400 animate-pulse shrink-0" size={14} />
            <span className="text-[11px] font-extrabold text-amber-400 uppercase tracking-widest leading-none">
              Simulando contexto de fin de semana/festivo ({
                effectiveDayType === 'WEEKDAY' ? 'Día de Semana' :
                effectiveDayType === 'SATURDAY_WORKABLE' ? 'Sábado' :
                effectiveDayType === 'WEEKEND' ? 'Fin de Semana' : 'Festivo (Col)'
              })
            </span>
            <span className="text-[9px] font-black bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30 shrink-0">
              MODO AUSENCIA ACTIVO
            </span>
          </div>
        </div>
      )}

      {/* Banner de Onboarding Sutil */}
      {!isConfiguring && !isBooting && !isRegistered && (chatId === 'TEST_BOT_DEBUG' ? (activeScenario?.profile === 'NEW') : true) && (
        <div className="px-4 py-2.5 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between backdrop-blur-md select-none animate-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Shield size={14} className="animate-pulse" />
            Cliente Nuevo Detectado
          </div>
          <button 
            onClick={() => setShowOnboarding(prev => !prev)}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-extrabold uppercase tracking-wider rounded-lg transition-all duration-200 cursor-pointer active:scale-95 shadow border border-emerald-500/20"
          >
            {showOnboarding ? '🙈 Ocultar Registro' : '📝 Ver Encuesta de Registro'}
          </button>
        </div>
      )}

      {isConfiguring ? (
        <div 
          className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-[#0b141a] flex flex-col items-center justify-center relative" 
          style={{ 
            backgroundImage: `linear-gradient(rgba(11, 20, 26, 0.95), rgba(11, 20, 26, 0.95)), url('https://i.pinimg.com/originals/85/70/f6/8570f6339d318933fa30979dcba3ad68.png')`, 
            backgroundRepeat: 'repeat', 
            backgroundSize: '360px' 
          }}
        >
          <TestConfigWizard 
            onStartTest={async (wizardConfig) => {
              setIsBooting(true);
              setIsConfiguring(false);
              
              try {
                // 1. Generar el primer "Frame" local optimista y prepararlo
                const { firstFrame } = await initializeSimulation(wizardConfig);
                console.log("ℹ️ MODO SIMULACIÓN: Primer Frame e inyección listos:", firstFrame);

                // 2. Mapear wizardConfig a los valores esperados por startForcedConversation
                const mappedConfig = {
                  profile: wizardConfig.userType === 'new' ? 'NEW' : 'EXISTING',
                  category: 'INITIATION',
                  gender: 'M',
                  dayType: wizardConfig.timeContext === 'holiday' ? 'HOLIDAY_NON_WORKABLE' : 'WEEKDAY',
                  timePeriod: wizardConfig.timeContext === 'night' ? 'NIGHT' : 'MORNING',
                  initialState: wizardConfig.initialState,
                  apiStatus: wizardConfig.apiStatus
                };

                // Pequeño delay artificial para que el usuario aprecie la transición (UX)
                await new Promise(resolve => setTimeout(resolve, 1500));

                await startForcedConversation(chatId, mappedConfig);
              } catch (error) {
                console.error("Error al iniciar simulación:", error);
              } finally {
                setIsBooting(false);
              }
            }}
            onClose={messages.length > 0 ? () => setIsConfiguring(false) : null}
          />
        </div>
      ) : (
        <>
          {/* Área de Mensajes con Fondo WhatsApp Clásico */}
          <div 
            className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-[#0b141a] flex flex-col gap-2 relative" 
            style={{ 
              backgroundImage: `linear-gradient(rgba(11, 20, 26, 0.95), rgba(11, 20, 26, 0.95)), url('https://i.pinimg.com/originals/85/70/f6/8570f6339d318933fa30979dcba3ad68.png')`, 
              backgroundRepeat: 'repeat', 
              backgroundSize: '360px' 
            }}
          >
            {isLoading && messages.length > 0 && (
              <div className="sticky top-0 z-20 w-full py-2 px-4 mb-2 bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md rounded-xl text-center flex items-center justify-center gap-2 text-xs text-emerald-400 animate-pulse select-none shadow-lg shadow-emerald-950/20">
                <span className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin shrink-0" />
                Cargando historial...
              </div>
            )}

            {!isRegistered && showOnboarding && (
              <QuickRegistrationForm
                chatId={chatId}
                gender={gender}
                setGender={setGender}
                onSuccess={() => {
                  setShowOnboarding(false);
                  loadActiveChats();
                }}
              />
            )}

            {messages.map((msg, idx) => (
              <MessageBubble key={msg.id || idx} message={msg} />
            ))}

            {/* Indicador de Escritura de WhatsApp con Animación de Rebote */}
            {isLoading && (
              <div className="flex w-full justify-start mb-2 px-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="relative max-w-[75%] rounded-2xl rounded-tl-none bg-[#202c33] text-slate-100 border border-slate-800 px-4 py-2.5 shadow-md flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-1 h-3 items-center">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-[12px] font-medium text-slate-400">Escribiendo respuesta...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Acordeón Inferior: Controles de FSM y Test */}
          <div className="shrink-0 flex flex-col bg-[#111b21] border-t border-white/5 relative z-10">
            {/* CONTENIDO COLAPSABLE INFERIOR */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showControls ? 'max-h-[400px] border-b border-white/5' : 'max-h-0'}`}>
              
              {/* Selector de Perfil y Género de Cliente */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-[#182229]/95 px-4 backdrop-blur-md relative border-b border-white/5">
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Perfil:</span>
                  <div className="flex bg-slate-950/80 rounded-xl p-1 border border-white/5 shadow-inner">
                    <button 
                      onClick={() => setIsNewClient(true)}
                      className={`px-4 py-1.5 text-[10px] uppercase font-bold rounded-lg transition-all duration-300 active:scale-95 cursor-pointer ${isNewClient ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-400'}`}
                    >
                      👶 NUEVO
                    </button>
                    <button 
                      onClick={() => setIsNewClient(false)}
                      className={`px-4 py-1.5 text-[10px] uppercase font-bold rounded-lg transition-all duration-300 active:scale-95 cursor-pointer ${!isNewClient ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-slate-400'}`}
                    >
                      ✅ EXISTENTE
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Género:</span>
                  <div className="flex bg-slate-950/80 rounded-xl p-1 border border-white/5 shadow-inner">
                    <button 
                      onClick={() => setGender('M')}
                      className={`px-4 py-1.5 text-[10px] uppercase font-bold rounded-lg transition-all duration-300 active:scale-95 cursor-pointer ${gender === 'M' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-500 hover:text-slate-400'}`}
                    >
                      👨 Caballero
                    </button>
                    <button 
                      onClick={() => setGender('F')}
                      className={`px-4 py-1.5 text-[10px] uppercase font-bold rounded-lg transition-all duration-300 active:scale-95 cursor-pointer ${gender === 'F' ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/20' : 'text-slate-500 hover:text-slate-400'}`}
                    >
                      👩 Dama
                    </button>
                  </div>
                </div>
              </div>

              {/* Barra de Simulación FSM Rápida */}
              <div className="bg-[#182229]/95 px-4 py-2.5 flex items-center gap-2.5 overflow-x-auto select-none backdrop-blur-md">
                <span className="text-[10px] font-extrabold text-slate-400 tracking-wider shrink-0">SIMULAR FSM:</span>
                <button
                  onClick={() => handleSimulateCategory('INITIATION')}
                  disabled={isCheckingDiagnostic || isLoading}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-[0_2px_8px_rgba(16,185,129,0.05)] hover:shadow-[0_4px_12px_rgba(16,185,129,0.15)] whitespace-nowrap"
                >
                  🚀 Iniciar
                </button>
                <button
                  onClick={() => handleSimulateCategory('RESPONSE')}
                  disabled={isCheckingDiagnostic || isLoading}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-cyan-400 border border-cyan-500/20 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-[0_2px_8px_rgba(6,182,212,0.05)] hover:shadow-[0_4px_12px_rgba(6,182,212,0.15)] whitespace-nowrap"
                >
                  💬 Responder
                </button>

                {/* Botones de Continuidad con Parámetros */}
                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                  <span className="text-[9px] font-extrabold text-slate-400 px-2 uppercase tracking-wider whitespace-nowrap">⏳ CONTINUIDAD:</span>
                  <button
                    onClick={() => handleSimulateCategory('CONTINUITY', 5)}
                    disabled={isCheckingDiagnostic || isLoading}
                    className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-amber-400 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap"
                  >
                    5 min
                  </button>
                  <button
                    onClick={() => handleSimulateCategory('CONTINUITY', 15)}
                    disabled={isCheckingDiagnostic || isLoading}
                    className="px-3 py-1.5 bg-orange-500/15 hover:bg-orange-500/25 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-orange-400 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap"
                  >
                    15 min
                  </button>
                </div>
              </div>
            </div>

            {/* HEADER / CONTROL DEL ACORDEÓN INFERIOR */}
            <div 
              onClick={() => setShowControls(!showControls)}
              className="h-8 bg-[#202c33]/90 hover:bg-[#202c33] border-b border-white/5 flex items-center justify-center cursor-pointer group transition-all duration-200"
            >
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 group-hover:text-emerald-400 transition-colors uppercase tracking-widest">
                {showControls ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
                {showControls ? 'Ocultar Controles de Simulación' : 'Ver Panel de Simulación y Test'}
              </div>
            </div>

            {/* Input de Mensaje de WhatsApp (Siempre Visible) */}
            <div className="p-3 bg-[#111b21]">
              <ChatInput onSendMessage={sendMessage} />
            </div>
          </div>
        </>
      )}

      {/* Modal de Confirmación de Reset */}
      {showResetConfirm && (
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#1f2c34] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4 animate-in scale-in duration-200">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 bg-rose-500/10 rounded-full border border-rose-500/20">
                <Trash2 size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-100 uppercase tracking-wide">¿Reiniciar Prueba?</h3>
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed">
              ¿Deseas reiniciar la prueba? Esto borrará el historial visual y reseteará el bot al estado inicial de bienvenida (FSM).
            </p>
            
            <div className="flex justify-end gap-3 mt-2">
              <button 
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 hover:bg-white/5 text-slate-400 hover:text-slate-200 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                onClick={async () => {
                  setShowResetConfirm(false);
                  await resetChat(chatId);
                  await runDiagnostic();
                  setValidationToken('');
                  setMatchStatus('');
                  setDayType('');
                  setIsNonWorkableContext(false);
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-rose-950/50 hover:shadow-rose-500/30"
              >
                Sí, Reiniciar
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* 2. Monitor de Debugging (Extremo Derecho) */}
      {showDebugSidebar && (
        <LiveDebugSidebar 
          currentChat={currentChat} 
          activeScenario={activeScenario} 
        />
      )}

      {isBooting && <LoadingOverlay />}
    </div>
  );
};

