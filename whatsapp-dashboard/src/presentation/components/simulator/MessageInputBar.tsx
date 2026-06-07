import React, { useRef, useState } from 'react';
import { Paperclip, Send, Smile, Mic } from 'lucide-react';

interface InputBarProps {
  onSendMessage: (text: string, file?: { buffer: Blob, name: string }) => Promise<void>;
}

export const MessageInputBar: React.FC<InputBarProps> = ({ onSendMessage }) => {
  const [text, setText] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    const currentText = text;
    setText('');
    await onSendMessage(currentText);
  };

  const handleClipClick = () => {
    // Forzar la apertura del selector de archivos nativo del sistema operacional
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Convertir el archivo cargado en un Blob/Buffer simulado para el flujo de la FSM
      await onSendMessage(`[Archivo Adjunto]: ${file.name}`, {
        buffer: file,
        name: file.name
      });
    } catch (error) {
      console.error('Fallo en la simulación multimedia:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = ''; // Limpiar input
    }
  };

  return (
    <div className="bg-[#0d0d0d] px-6 py-3 flex items-center gap-4 border-t border-white/5 w-full">
      
      {/* Opciones de Entrada Multimedia */}
      <div className="flex items-center gap-4 text-text-muted">
        <button className="hover:text-brand-primary transition-colors cursor-pointer">
          <Smile size={20} />
        </button>
        
        {/* Trigger de Clip */}
        <button 
          onClick={handleClipClick}
          className={`hover:text-brand-primary transition-colors cursor-pointer ${isUploading ? 'animate-pulse text-brand-primary' : ''}`}
          title="Adjuntar Documento RUT"
          disabled={isUploading}
        >
          <Paperclip size={18} />
        </button>
        
        {/* Hidden Native Input */}
        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,image/*"
          className="hidden"
        />
      </div>

      {/* Caja de Texto Controlada */}
      <form onSubmit={handleTextSubmit} className="flex-1 flex items-center gap-4">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={isUploading ? "Procesando archivo binario en el Storage..." : "Escribe un mensaje..."}
          disabled={isUploading}
          className="flex-1 bg-[#151718] border border-white/5 rounded-xl px-4 py-3 text-xs text-text-main outline-none focus:border-brand-primary/30 transition-all placeholder:text-text-muted/40 font-medium"
        />
        
        <button 
          type="submit"
          className="h-10 w-10 bg-brand-primary/10 hover:bg-brand-primary text-brand-primary hover:text-white rounded-xl flex items-center justify-center transition-all cursor-pointer border border-brand-primary/20 hover:border-transparent active:scale-95"
        >
          <Send size={14} className="ml-0.5" />
        </button>
      </form>

      <div className="text-text-muted hover:text-brand-primary transition-colors cursor-pointer">
        <Mic size={18} />
      </div>

    </div>
  );
};
