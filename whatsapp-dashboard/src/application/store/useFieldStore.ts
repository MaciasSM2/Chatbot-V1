import { create } from 'zustand';

export interface CustomField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  required: boolean;
  fixed?: boolean;
  options?: string[];
}

interface FieldStore {
  customFields: CustomField[];
  addField: (field: Omit<CustomField, 'id'>) => void;
  removeField: (id: string) => void;
  updateField: (updatedField: CustomField) => void;
}

const fixedFields: CustomField[] = [
  {
    id: 'document_type',
    label: 'Tipo de Documento',
    type: 'select',
    required: true,
    fixed: true,
    options: ['Cédula de Ciudadanía', 'Tarjeta de Identidad', 'Cédula de Extranjería', 'Pasaporte']
  },
  {
    id: 'document_number',
    label: 'Numero de ID',
    type: 'text',
    required: true,
    fixed: true
  }
];

export const useFieldStore = create<FieldStore>((set) => {
  // Inicializar de localStorage si existe
  const getInitialFields = (): CustomField[] => {
    if (typeof window === 'undefined') return fixedFields;
    const saved = localStorage.getItem('customFields');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as CustomField[];
        // Filtrar cualquier campo previo que tenga el mismo ID que nuestros campos fijos
        const filtered = parsed.filter(f => f.id !== 'document_type' && f.id !== 'document_number');
        return [...fixedFields, ...filtered];
      } catch {
        // Fallback a campos semilla si hay error
      }
    }
    return [
      ...fixedFields,
      { id: 'email', label: 'Correo Electrónico', type: 'text', required: false },
      { id: 'city', label: 'Ciudad', type: 'text', required: false }
    ];
  };

  const saveFields = (fields: CustomField[]) => {
    localStorage.setItem('customFields', JSON.stringify(fields));
  };

  return {
    customFields: getInitialFields(),
    
    addField: (field) => set((state) => {
      // Normalizar nombre de etiqueta para crear un ID compatible
      const normalizedLabel = field.label.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
        .toLowerCase()
        .trim();
        
      const id = normalizedLabel
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_');
      
      // Evitar IDs vacíos o duplicados
      const baseId = id || 'campo';
      const finalId = state.customFields.some(f => f.id === baseId) 
        ? `${baseId}_${Date.now()}` 
        : baseId;

      const newField: CustomField = { ...field, id: finalId };
      const updated = [...state.customFields, newField];
      saveFields(updated);
      return { customFields: updated };
    }),

    removeField: (id) => set((state) => {
      // No permitir borrar campos fijos
      const field = state.customFields.find(f => f.id === id);
      if (field?.fixed) return state;

      const updated = state.customFields.filter(f => f.id !== id);
      saveFields(updated);
      return { customFields: updated };
    }),

    updateField: (updatedField) => set((state) => {
      // No permitir modificar campos fijos
      const field = state.customFields.find(f => f.id === updatedField.id);
      if (field?.fixed) return state;

      const updated = state.customFields.map(f => f.id === updatedField.id ? updatedField : f);
      saveFields(updated);
      return { customFields: updated };
    })
  };
});
