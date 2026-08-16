/**
 * @file TestConfigWizard.jsx
 * @description Wizard secuencial y progresivo para la configuración del escenario de test con pantalla de resumen final.
 */

import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Play, UserCircle2, Clock, Zap, ShieldAlert, CheckCircle2, X } from 'lucide-react';
import { TestSummaryStep } from './TestSummaryStep';


const initialDefaults: Record<string, string> = {
  userType: 'new',
  timeContext: 'work_hours',
  initialState: 'GREETING',
  apiStatus: 'SUCCESS'
};

export const TestConfigWizard = ({ onStartTest, onClose }: { onStartTest: (config: any) => void; onClose: () => void }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [config, setConfig] = useState(initialDefaults);

  const steps = [
    {
      id: 'identity',
      title: 'Identidad del Sujeto',
      icon: <UserCircle2 className="text-emerald-500" />,
      description: 'Define si el bot debe activar el flujo de registro o reconocer al cliente.',
      options: [
        { value: 'new', label: 'Cliente Nuevo (Flujo de Registro)', detail: 'El bot pedirá datos básicos y los guardará en el JSONB.' },
        { value: 'recurring', label: 'Cliente Recurrente', detail: 'El bot saludará por nombre usando la memoria local.' }
      ],
      key: 'userType'
    },
    {
      id: 'time',
      title: 'Contexto Temporal (Colombia)',
      icon: <Clock className="text-emerald-500" />,
      description: 'Evalúa la respuesta según la hora del sistema y festivos en Colombia.',
      options: [
        { value: 'work_hours', label: 'Día Laboral (8:00 AM - 6:00 PM)', detail: 'Flujo estándar de atención inmediata.' },
        { value: 'holiday', label: 'Festivo Nacional (Ley Emiliani)', detail: 'Mensaje de ausencia por día no laboral.' },
        { value: 'night', label: 'Horario Nocturno', detail: 'Atención automatizada sin soporte humano.' }
      ],
      key: 'timeContext'
    },
    {
      id: 'fsm',
      title: 'Punto de Inicio (FSM)',
      icon: <Zap className="text-emerald-500" />,
      description: 'Fuerza la conversación a una fase específica del árbol de decisión.',
      options: [
        { value: 'GREETING', label: 'Inicio (Bienvenida)', detail: 'Desde el primer mensaje de contacto.' },
        { value: 'MAIN_MENU', label: 'Menú de Opciones Principal', detail: 'Salta directamente a las opciones de servicio.' },
        { value: 'AWAITING_DATA', label: 'Esperando Datos de Registro', detail: 'Prueba la validación de entrada del usuario.' }
      ],
      key: 'initialState'
    },
    {
      id: 'api',
      title: 'Simulación Meta API',
      icon: <ShieldAlert className="text-emerald-500" />,
      description: 'Inyecta fallos controlados para verificar la resiliencia del bot.',
      options: [
        { value: 'SUCCESS', label: 'Conexión Exitosa (200 OK)', detail: 'Comportamiento normal del servidor.' },
        { value: 'ERROR_500', label: 'Servidor Meta Caído (500)', detail: 'Prueba la lógica de reintentos y encolamiento.' },
        { value: 'TIMEOUT', label: 'Latencia Alta / Timeout', detail: 'Inyecta latencia alta para simular retraso en la API.' }
      ],
      key: 'apiStatus'
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const isSummaryStep = currentStep === steps.length;
  const currentStepData = !isSummaryStep ? steps[currentStep] : null as any;


  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-surface-main/98 backdrop-blur-xl p-6">
      <div className="w-full max-w-xl bg-surface-panel rounded-[32px] shadow-2xl border border-border-subtle overflow-hidden animate-in fade-in zoom-in duration-300 relative">
        
        {onClose && (
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-content-secondary hover:text-content-primary hover:bg-white/5 rounded-full transition-all cursor-pointer z-10 active:scale-95 border border-transparent hover:border-border-subtle"
            title="Cerrar configuración"
          >
            <X size={18} />
          </button>
        )}

        {/* Barra de Progreso Superior */}
        <div className="flex h-1.5 bg-surface-raised">
          {steps.map((_, idx) => (
            <div 
              key={idx}
              className={`flex-1 transition-all duration-500 ${idx <= currentStep ? 'bg-emerald-500' : 'bg-transparent'}`}
            />
          ))}
        </div>

        <div className="p-10">
          {/* Cabecera del Paso o Resumen */}
          {!isSummaryStep ? (
            <>
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-emerald-500/10 rounded-2xl">
                  {currentStepData.icon}
                </div>
                <div>
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Paso {currentStep + 1} de {steps.length}</p>
                  <h2 className="text-xl font-bold text-content-primary">{currentStepData.title}</h2>
                </div>
              </div>

              <p className="text-content-secondary text-xs mb-8 leading-relaxed">
                {currentStepData.description}
              </p>

              {/* Opciones Visibles */}
              <div className="space-y-3">
                {currentStepData.options.map((opt: any) => (
                  <button
                    key={opt.value}
                    onClick={() => setConfig({ ...config, [currentStepData.key]: opt.value })}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all cursor-pointer group ${
                      config[currentStepData.key] === opt.value
                        ? 'border-emerald-500 bg-emerald-500/5'
                        : 'border-border-subtle bg-surface-panel hover:border-content-secondary/30'
                    }`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className={`font-bold text-xs ${config[currentStepData.key] === opt.value ? 'text-emerald-400' : 'text-content-primary'}`}>
                        {opt.label}
                      </span>
                      {config[currentStepData.key] === opt.value && (
                        <CheckCircle2 size={16} className="text-emerald-500" />
                      )}
                    </div>
                    <p className="text-[10px] text-content-secondary/70 group-hover:text-content-secondary transition-colors">
                      {opt.detail}
                    </p>
                  </button>
                ))}
              </div>

              {/* Navegación Inferior */}
              <div className="mt-10 flex items-center justify-between">
                <button 
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  className={`flex items-center gap-2 text-xs font-bold transition-opacity cursor-pointer ${currentStep === 0 ? 'opacity-0 pointer-events-none' : 'text-content-secondary hover:text-content-primary'}`}
                >
                  <ChevronLeft size={16} /> Atrás
                </button>

                <button 
                  onClick={handleNext}
                  className="flex items-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3.5 rounded-2xl font-black text-xs transition-all shadow-xl shadow-emerald-900/20 active:scale-95 cursor-pointer"
                >
                  Siguiente <ChevronRight size={16} />
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-emerald-500/10 rounded-2xl">
                  <CheckCircle2 className="text-emerald-500" size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Paso 5 de 5 (Confirmación)</p>
                  <h2 className="text-xl font-bold text-content-primary">Resumen de Escenario</h2>
                </div>
              </div>

              <p className="text-content-secondary text-xs mb-8 leading-relaxed">
                Confirma la configuración elegida para la simulación antes de activar el motor FSM de test.
              </p>

              <TestSummaryStep 
                config={config} 
                setConfig={setConfig} 
                setCurrentStep={setCurrentStep as any} 
                onStartTest={onStartTest} 
                steps={steps} 
                initialDefaults={initialDefaults} 
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
