import React, { useState, useEffect } from 'react';
import { User, CreditCard, Users, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { clientService } from '../../../core/services/ClientApiService';

export const QuickRegistrationForm = ({ chatId, gender, setGender, onSuccess }) => {
  const [name, setName] = useState('');
  const [documentType, setDocumentType] = useState('Cédula de Ciudadanía');
  const [documentNumber, setDocumentNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleGenderChange = (selectedGender) => {
    if (setGender) {
      setGender(selectedGender);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim()) {
      setErrorMsg('El nombre completo es obligatorio');
      return;
    }
    if (!documentNumber.trim()) {
      setErrorMsg('El número de documento es obligatorio');
      return;
    }

    setIsSubmitting(true);
    try {
      const metadata = {
        document_type: documentType,
        document_number: documentNumber.trim(),
        gender: gender
      };

      // Registrar/Crear cliente marcándolo como isRegistered = true
      await clientService.createClient(
        chatId,
        name.trim(),
        true, // isRegistered = true
        metadata
      );

      setSuccessMsg('¡Cliente registrado con éxito!');
      
      // Esperamos un segundo para mostrar la micro-animación de éxito antes de notificar al padre
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 1000);
    } catch (err) {
      console.error('Error al registrar cliente:', err);
      setErrorMsg(err.message || 'Error al conectar con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto my-3 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-slate-900/75 p-5 shadow-xl backdrop-blur-md">
        
        {/* Decoración de gradiente en las esquinas */}
        <div className="absolute -right-16 -top-16 -z-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-xl" />
        <div className="absolute -left-16 -bottom-16 -z-10 h-32 w-32 rounded-full bg-cyan-500/10 blur-xl" />

        {/* Encabezado */}
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner">
            <Sparkles size={18} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider">Onboarding: Cliente Nuevo</h3>
            <p className="text-[10px] text-slate-400">Complete los datos de registro rápido para este número.</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300 animate-in shake duration-300">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center gap-2 animate-in zoom-in-95 duration-300">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0 animate-bounce" />
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          
          {/* Nombre Completo */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User size={12} className="text-emerald-400/80" /> Nombre Completo
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
                placeholder="Ej. Juan Pérez"
                className="w-full rounded-xl border border-white/5 bg-slate-950/70 py-2.5 pl-3.5 pr-3.5 text-xs text-slate-100 placeholder:text-slate-600 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none transition-all duration-300 shadow-inner"
              />
            </div>
          </div>

          {/* Tipo de Documento */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard size={12} className="text-emerald-400/80" /> Tipo de Documento
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-white/5 bg-slate-950/70 p-2.5 text-xs text-slate-100 focus:border-emerald-500/50 focus:outline-none transition-all duration-300 shadow-inner"
            >
              <option value="Cédula de Ciudadanía">Cédula de Ciudadanía (CC)</option>
              <option value="Tarjeta de Identidad">Tarjeta de Identidad (TI)</option>
              <option value="Cédula de Extranjería">Cédula de Extranjería (CE)</option>
              <option value="Pasaporte">Pasaporte (PA)</option>
            </select>
          </div>

          {/* Número de Documento */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard size={12} className="text-emerald-400/80" /> Número de Documento / ID
            </label>
            <input
              type="text"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              disabled={isSubmitting}
              placeholder="Ej. 10203040"
              className="w-full rounded-xl border border-white/5 bg-slate-950/70 py-2.5 px-3.5 text-xs text-slate-100 placeholder:text-slate-600 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none transition-all duration-300 shadow-inner"
            />
          </div>

          {/* Selector de Género en el Formulario */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Users size={12} className="text-emerald-400/80" /> Género
            </label>
            <div className="flex bg-slate-950/80 rounded-xl p-1 border border-white/5 shadow-inner w-full">
              <button
                type="button"
                onClick={() => handleGenderChange('M')}
                disabled={isSubmitting}
                className={`flex-1 py-2 text-[10px] uppercase font-bold rounded-lg transition-all duration-300 active:scale-[0.97] cursor-pointer ${
                  gender === 'M'
                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                    : 'text-slate-500 hover:text-slate-400'
                }`}
              >
                👨 Caballero
              </button>
              <button
                type="button"
                onClick={() => handleGenderChange('F')}
                disabled={isSubmitting}
                className={`flex-1 py-2 text-[10px] uppercase font-bold rounded-lg transition-all duration-300 active:scale-[0.97] cursor-pointer ${
                  gender === 'F'
                    ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/20'
                    : 'text-slate-500 hover:text-slate-400'
                }`}
              >
                👩 Dama
              </button>
            </div>
          </div>

          {/* Botón Guardar */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl cursor-pointer active:scale-95 transition-all duration-300 shadow-md shadow-emerald-950/50 hover:shadow-emerald-500/25 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin text-white" />
                Registrando Cliente...
              </>
            ) : (
              'Guardar Registro'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
