'use client';

import React, { useState, useEffect } from 'react';
import { IGreeting } from '../../core/models/Greeting';
import { greetingService } from '../../core/services/GreetingApiService';
import { WhiteBoxEditor } from './WhiteBoxEditor';

export const GreetingDashboard: React.FC = () => {
  // Estado de Datos y UI (Sin estados de filtros globales)
  const [greetings, setGreetings] = useState<IGreeting[]>([]);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Al montar el componente, traemos TODOS los saludos
  useEffect(() => {
    loadAllGreetings();
  }, []);

  async function loadAllGreetings() {
    setIsLoading(true);
    try {
      const data = await greetingService.getGreetings();
      setGreetings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando los saludos", error);
      setGreetings([]);
    } finally {
      setIsLoading(false);
    }
  }

  const handleAddNewBox = () => {
    const newBox: IGreeting = {
      id: `temp-${Date.now()}`,
      dayType: 'WEEKDAY',  // Valores por defecto al crear una nueva caja
      timePeriod: 'MORNING',
      text: '',
      category: 'RESPONSE'
    };
    // Lo agregamos al principio de la lista para que sea visible de inmediato
    setGreetings([newBox, ...greetings]);
  };

  const confirmDeletion = async () => {
    if (itemToDelete) {
      // Si no es un ID temporal, lo borramos en la BD real
      if (!itemToDelete.startsWith('temp-')) {
        await greetingService.deleteGreeting(itemToDelete);
      }
      setGreetings(greetings.filter(g => g.id !== itemToDelete));
      setItemToDelete(null);
    }
  };

  const handleSaveGreeting = async (updatedGreeting: IGreeting) => {
    try {
      await greetingService.saveGreeting(updatedGreeting);
      // Opcional: Recargar o actualizar el estado local
      setGreetings(prev => prev.map(g => g.id === updatedGreeting.id ? updatedGreeting : g));
      // Si el id era temp-, deberíamos recargar para obtener el real o gestionarlo.
      if (updatedGreeting.id.startsWith('temp-')) {
          await loadAllGreetings();
      }
    } catch (error) {
      console.error("Error guardando saludo:", error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-background-main min-h-screen text-text-main">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text-main">Gestión de Saludos (Carta Negra)</h1>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-text-dim">Cargando plantillas...</div>
      ) : (
        <div className="space-y-6">
          {/* Renderizado Dinámico de White Boxes */}
          {greetings.map((greet) => (
            <WhiteBoxEditor 
               key={greet.id} 
               greeting={greet} 
               onSave={handleSaveGreeting} 
               onDeleteRequest={(id) => setItemToDelete(id)} 
            />
          ))}

          {/* Botón Añadir */}
          <button 
            onClick={handleAddNewBox}
            className="w-full py-4 mt-4 border-2 border-dashed border-[var(--theme-accent)] text-[var(--theme-accent)] font-bold rounded-xl hover:bg-[var(--theme-accent)]/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="text-xl">+</span> Agregar nueva variante de saludo
          </button>
        </div>
      )}

      {/* Modal de Alerta de Eliminación */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-background-panel p-6 rounded-2xl shadow-2xl max-w-sm w-full border border-border-subtle text-text-main">
            <h3 className="text-xl font-bold text-red-500 mb-2">¿Eliminar esta plantilla?</h3>
            <p className="text-text-muted mb-6 text-sm">
              Esta acción es permanente. La plantilla se borrará de la base de datos y dejará de enviarse a los clientes en WhatsApp.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 text-text-main bg-background-header border border-border-subtle font-medium hover:bg-background-panel rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDeletion}
                className="px-4 py-2 text-white bg-red-600 font-medium hover:bg-red-700 rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
