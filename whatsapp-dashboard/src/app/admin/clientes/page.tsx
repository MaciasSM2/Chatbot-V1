/**
 * @file page.tsx
 * @description Smart Component que actúa como el Container principal para la administración de clientes.
 * Aplica inyección de dependencias implícita mediante servicios encapsulados y stores de Zustand.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { clientService, IClient } from '../../../core/services/ClientApiService';
import { useFieldStore, CustomField } from '../../../application/store/useFieldStore';
import { ClientTable } from './components/ClientTable';
import { ClientFilters } from './components/ClientFilters';
import { CSVUploader, ParsedCSVRow } from './components/CSVUploader';
import { ClientFormModal } from './components/ClientFormModal';
import { FieldModal } from '../../../components/admin/clientes/FieldModal';
import { CustomFieldsConfig } from '../../../components/admin/clientes/CustomFieldsConfig';
import { ClientExportActions } from '../../../components/admin/ClientExportActions';
import { RefreshCw, Plus, Settings, ChevronUp, ChevronDown, AlertCircle, UserX } from 'lucide-react';

export default function ClientesAdminPage() {
  const router = useRouter();

  // --- Estado Local ---
  const [clients, setClients] = useState<IClient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'registered' | 'unregistered'>('all');
  
  // UI States
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [csvUploading, setCsvUploading] = useState<boolean>(false);

  // Field Config States
  const [isFieldModalOpen, setIsFieldModalOpen] = useState<boolean>(false);
  const [fieldModalMode, setFieldModalMode] = useState<'add' | 'edit'>('add');
  const [selectedField, setSelectedField] = useState<CustomField | undefined>(undefined);

  // --- External Stores (Zustand) ---
  const { customFields, addField, removeField, updateField } = useFieldStore();

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  /**
   * Carga de forma asíncrona la lista de clientes desde la base de datos PostgreSQL.
   */
  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await clientService.getClients();
      setClients(data);
    } catch (err: any) {
      setError(err?.message || 'Error inesperado cargando los clientes');
      showToast('Error cargando los clientes', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Ciclo de Vida ---
  useEffect(() => {
    setTimeout(() => {
      fetchClients();
    }, 0);
  }, [fetchClients]);

  // --- Handlers de Dominio ---

  const handleToggleRegistration = async (client: IClient) => {
    try {
      const nextVal = !client.isRegistered;
      const updated = await clientService.updateClient(client.id, client.name, nextVal, client.metadata);
      setClients((prev) => prev.map((c) => (c.id === client.id ? updated : c)));
      showToast(`Estado de ${client.phoneNumber} cambiado a ${nextVal ? 'Recurrente' : 'Primer Contacto'}.`);
    } catch (err) {
      console.error('Error al cambiar estado de registro:', err);
      showToast('Error al actualizar el estado', 'error');
    }
  };

  const handleSaveClient = async (clientData: Partial<IClient>) => {
    try {
      // Si el cliente ya tiene ID, podríamos actualizarlo (si lo permitimos desde este modal)
      // En este caso, el usuario lo llamó "handleSave" pero la lógica de edición completa no está en la tabla (quitaron onSaveRow).
      // Pero igual soportaremos la creación.
      const newClient = await clientService.createClient(
        clientData.phoneNumber!, 
        clientData.name || null, 
        clientData.isRegistered || false, 
        clientData.metadata || {}
      );
      setClients((prev) => [newClient, ...prev]);
      showToast('Cliente guardado exitosamente.');
      setIsCreateModalOpen(false);
    } catch (err: any) {
      showToast(err?.message || 'Error al guardar el cliente', 'error');
      throw err;
    }
  };

  const handleUploadBatch = async (rows: ParsedCSVRow[]) => {
    let successCount = 0;
    let errorCount = 0;

    for (const row of rows) {
      try {
        await clientService.createClient(row.phone, row.name, false, row.metadata);
        successCount++;
      } catch {
        errorCount++;
      }
    }

    showToast(`Importación completada en lote. Recargando lista...`);
    fetchClients();
  };

  const startChat = (phoneNumber: string) => {
    localStorage.setItem('pending_chat', phoneNumber);
    router.push('/');
  };

  // --- Handlers de Schema (Fields) ---

  const handleOpenAddField = () => {
    setFieldModalMode('add');
    setSelectedField(undefined);
    setIsFieldModalOpen(true);
  };

  const handleOpenEditField = (field: CustomField) => {
    setFieldModalMode('edit');
    setSelectedField(field);
    setIsFieldModalOpen(true);
  };

  const handleSaveField = (label: string, type: 'text' | 'number' | 'date' | 'select', required: boolean) => {
    if (!label.trim()) {
      showToast('La etiqueta del campo es requerida', 'error');
      return;
    }

    if (fieldModalMode === 'add') {
      addField({ label: label.trim(), type, required });
      showToast('Campo personalizado agregado.');
    } else if (selectedField) {
      updateField({ id: selectedField.id, label: label.trim(), type, required });
      showToast('Campo personalizado actualizado.');
    }
    setIsFieldModalOpen(false);
  };

  const handleRemoveField = (id: string) => {
    if (confirm('¿Estás seguro de que deseas retirar este campo? Los datos en BD no se borrarán.')) {
      removeField(id);
      showToast('Campo personalizado retirado.');
    }
  };

  // --- Paginación ---
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 50;

  // Lógica de Filtrado Exclusiva en Memoria
  const filteredClients = clients.filter((client) => {
    const text = searchTerm.toLowerCase();
    const phoneMatch = client.phoneNumber.toLowerCase().includes(text);
    const nameMatch = (client.name || '').toLowerCase().includes(text);
    const metadataMatch = Object.values(client.metadata || {}).some((val) =>
      String(val).toLowerCase().includes(text)
    );
    
    const matchesText = phoneMatch || nameMatch || metadataMatch;
    
    if (statusFilter === 'registered') return matchesText && client.isRegistered;
    if (statusFilter === 'unregistered') return matchesText && !client.isRegistered;
    return matchesText;
  });

  // Cálculo de Paginación
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Resetear la página al buscar o filtrar
  useEffect(() => {
    setTimeout(() => {
      setCurrentPage(1);
    }, 0);
  }, [searchTerm, statusFilter]);

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-10 font-sans text-gray-800">
      <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
        
        {/* Header de la Aplicación */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-gray-200/60 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex flex-wrap items-center gap-3">
              Administración de Clientes
              <span className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-bold border border-indigo-100 shadow-sm flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                Campos Dinámicos JSONB
              </span>
            </h1>
            <p className="text-sm text-gray-500 mt-1.5">
              Esquema desacoplado. Cambios visuales controlados por feature toggles de arquitectura.
            </p>
          </div>

          {/* Acciones de Cabecera */}
          <div className="flex flex-wrap gap-3">
            <CSVUploader 
              isUploading={csvUploading}
              onUploadStart={() => setCsvUploading(true)}
              onProcessBatch={handleUploadBatch}
              onImportSuccess={(count) => {
                setCsvUploading(false);
                showToast(`Se importaron ${count} registros con éxito.`);
              }}
              onImportError={(err) => {
                setCsvUploading(false);
                showToast(err, 'error');
              }}
            />

            <ClientExportActions clients={clients} />

            <button
              onClick={() => setIsConfigOpen(!isConfigOpen)}
              className={`flex items-center gap-2 border px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 ${
                isConfigOpen
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-indigo-100'
                  : 'bg-white border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Settings size={16} />
              Esquema de Datos
              {isConfigOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/10 active:scale-95"
            >
              <Plus size={16} />
              Nuevo Cliente
            </button>
            <button
              onClick={fetchClients}
              disabled={loading}
              className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 transition-all active:scale-95 shadow-sm"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Actualizar
            </button>
          </div>
        </div>

        {/* Notificación Toast Premium */}
        {toastMessage && (
          <div
            className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 p-4 rounded-2xl shadow-2xl border transition-all duration-300 transform translate-y-0 animate-bounce ${
              toastMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <AlertCircle size={20} className={toastMessage.type === 'success' ? 'text-emerald-500' : 'text-rose-500'} />
            <span className="text-sm font-semibold">{toastMessage.text}</span>
          </div>
        )}

        {/* SECCIÓN CONFIGURACIÓN DE ESQUEMA DE DATOS */}
        {isConfigOpen && (
          <CustomFieldsConfig
            customFields={customFields}
            onAddField={handleOpenAddField}
            onEditField={handleOpenEditField}
            onRemoveField={handleRemoveField}
          />
        )}

        {/* Módulo de Filtros */}
        <ClientFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />

        {/* Módulo de Tabla Core o Empty States */}
        {filteredClients.length === 0 && !loading && !error ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-200 shadow-sm">
            <div className="inline-flex items-center justify-center p-4 bg-gray-50 text-gray-400 rounded-full mb-4">
              <UserX size={40} />
            </div>
            <h3 className="text-lg font-bold text-gray-800">No se encontraron clientes</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
              Prueba modificando los filtros de búsqueda o el tipo de estado seleccionado.
            </p>
          </div>
        ) : (
          <ClientTable
            clients={paginatedClients}
            customFields={customFields}
            loading={loading}
            error={error}
            onToggleRegistration={handleToggleRegistration}
            onRetry={fetchClients}
            onStartChat={startChat}
            currentPage={currentPage}
            totalPages={totalPages}
            onNextPage={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            onPrevPage={() => setCurrentPage(p => Math.max(1, p - 1))}
          />
        )}

      </div>

      {/* MODAL CONFIGURACIÓN DE UN CAMPO INDIVIDUAL */}
      <FieldModal
        key={isFieldModalOpen ? `open-${selectedField?.id || 'new'}` : 'field-modal-closed'}
        isOpen={isFieldModalOpen}
        mode={fieldModalMode}
        field={selectedField}
        onClose={() => setIsFieldModalOpen(false)}
        onSave={handleSaveField}
      />

      {/* MODAL DE CREACIÓN MANUAL DE CLIENTE */}
      <ClientFormModal
        key={isCreateModalOpen ? 'open' : 'create-modal-closed'}
        isOpen={isCreateModalOpen}
        customFields={customFields}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleSaveClient}
      />
    </div>
  );
}
