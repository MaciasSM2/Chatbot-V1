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
      // Asumimos que al no enviar parámetros, el backend nos devuelve toda la colección
      const data = await greetingService.getGreetings(); 
      setGreetings(data);
    } catch (error) {
      console.error("Error cargando los saludos", error);
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
    <div className="max-w-3xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Saludos (Carta Blanca)</h1>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-gray-500">Cargando plantillas...</div>
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
            className="w-full py-4 mt-4 border-2 border-dashed border-blue-400 text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-xl">+</span> Agregar nueva variante de saludo
          </button>
        </div>
      )}

      {/* Modal de Alerta de Eliminación */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg shadow-2xl max-w-sm w-full border border-gray-200">
            <h3 className="text-xl font-bold text-red-600 mb-2">¿Eliminar esta plantilla?</h3>
            <p className="text-gray-600 mb-6 text-sm">
              Esta acción es permanente. La plantilla se borrará de la base de datos y dejará de enviarse a los clientes en WhatsApp.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 font-medium hover:bg-gray-200 rounded transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDeletion}
                className="px-4 py-2 text-white bg-red-600 font-medium hover:bg-red-700 rounded transition-colors shadow-sm"
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
