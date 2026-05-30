import React, { useState, useEffect } from 'react';
import { IGreeting, DayType, TimePeriod, GreetingCategory } from '../../core/models/Greeting';

interface Props {
  greeting: IGreeting;
  onSave: (updatedGreeting: IGreeting) => void;
  onDeleteRequest: (id: string) => void;
}

export const WhiteBoxEditor: React.FC<Props> = ({ greeting, onSave, onDeleteRequest }) => {
  // Estado local encapsulado
  const [text, setText] = useState(greeting.text);
  const [dayType, setDayType] = useState<DayType>(greeting.dayType);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(greeting.timePeriod);
  const [category, setCategory] = useState<GreetingCategory>(greeting.category || 'RESPONSE');
  const [isEdited, setIsEdited] = useState(false);



  // Manejadores de cambios
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setIsEdited(true);
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDayType(e.target.value as DayType);
    setIsEdited(true);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimePeriod(e.target.value as TimePeriod);
    setIsEdited(true);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value as GreetingCategory);
    setIsEdited(true);
  };

  const handleSave = () => {
    onSave({ ...greeting, text, dayType, timePeriod, category });
    setIsEdited(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-4 transition-all hover:shadow-lg">
      
      {/* Contenedor de Condicionales (Listas Desplegables Internas) */}
      <div className="flex gap-4 mb-4 bg-gray-50 p-3 rounded border border-gray-100">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Días de ejecución</label>
          <select 
            value={dayType} 
            onChange={handleDayChange}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
          >
            <option value="WEEKDAY">Semana hábil (Lun-Vie)</option>
            <option value="WEEKEND">Fin de semana (Sab-Dom)</option>
            <option value="SATURDAY_WORKABLE">Sábado Laborable</option>
            <option value="SUNDAY_WORKABLE">Domingo Laborable</option>
            <option value="HOLIDAY_WORKABLE">Festivo Laborable</option>
            <option value="HOLIDAY_NON_WORKABLE">Festivo No Laborable</option>
          </select>
        </div>
        
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Horario asignado</label>
          <select 
            value={timePeriod} 
            onChange={handleTimeChange}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
          >
            <option value="MORNING">Mañana</option>
            <option value="AFTERNOON">Tarde</option>
            <option value="NIGHT">Noche</option>
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Categoría</label>
          <select 
            value={category} 
            onChange={handleCategoryChange}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
          >
            <option value="INITIATION">Inicio (Bot inicia)</option>
            <option value="RESPONSE">Respuesta (Responde a usuario)</option>
            <option value="CONTINUITY">Continuidad (Inactividad)</option>
          </select>
        </div>
      </div>

      {/* Área de Texto del Saludo */}
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Plantilla de Saludo (Usa <span className="font-mono text-blue-600 bg-blue-50 px-1 rounded">{`{{name}}`}</span> para el nombre)
      </label>
      <textarea
        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y min-h-[100px] text-gray-800"
        value={text}
        onChange={handleTextChange}
        placeholder="Ej: ¡Buenos días {{name}}! ¿En qué puedo ayudarte?"
      />
      
      {/* Botonera de Acción */}
      <div className="flex justify-between mt-4">
        <button
          onClick={() => onDeleteRequest(greeting.id)}
          className="px-4 py-2 text-red-600 bg-red-50 font-medium rounded hover:bg-red-100 transition-colors"
        >
          Eliminar White Box
        </button>
        <button
          onClick={handleSave}
          disabled={!isEdited}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            isEdited ? 'bg-slate-500 hover:bg-slate-600 text-white shadow-sm' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Guardar Cambios
        </button>
      </div>
    </div>
  );
};
