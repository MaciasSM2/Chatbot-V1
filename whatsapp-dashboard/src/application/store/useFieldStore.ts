import { create } from 'zustand';
import { executeSecureRequest, getApiUrl } from '../../core/apiClient';

export interface CustomFieldDefinition {
  key: string;
  label: string;
  type: 'TEXT' | 'NUMBER' | 'DATE';
  isRequired: boolean;
}

export interface CustomField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  required: boolean;
  fixed?: boolean;
  options?: string[];
}

interface FieldState {
  dynamicFields: CustomFieldDefinition[];
  customFields: CustomField[]; // For backward compatibility with ExportEngine and other components
  isSyncing: boolean;
  loadRemoteSchema: () => Promise<void>;
  registerNewField: (field: CustomFieldDefinition) => Promise<boolean>;
}

export const useFieldStore = create<FieldState>((set, get) => ({
  dynamicFields: [],
  customFields: [],
  isSyncing: false,

  loadRemoteSchema: async () => {
    try {
      const result: any = await executeSecureRequest(`${getApiUrl()}/admin/crm/clients/schema`);
      if (result.success && result.schema) {
        const schema = result.schema as CustomFieldDefinition[];
        const mappedCustomFields: CustomField[] = schema.map(f => ({
          id: f.key,
          label: f.label,
          type: f.type.toLowerCase() as any,
          required: f.isRequired
        }));
        set({ 
          dynamicFields: schema,
          customFields: mappedCustomFields
        });
      }
    } catch (err) {
      console.error('❌ [FieldStore] Error sincronizando esquema remoto:', err);
    }
  },

  registerNewField: async (field: CustomFieldDefinition): Promise<boolean> => {
    set({ isSyncing: true });
    const baselineFields = get().dynamicFields;
    const updatedSchema = [...baselineFields, field];

    try {
      const result: any = await executeSecureRequest(`${getApiUrl()}/admin/crm/clients/schema`, {
        method: 'POST',
        body: JSON.stringify({ schema: updatedSchema })
      });

      if (result.success) {
        const mappedCustomFields: CustomField[] = updatedSchema.map(f => ({
          id: f.key,
          label: f.label,
          type: f.type.toLowerCase() as any,
          required: f.isRequired
        }));
        set({ 
          dynamicFields: updatedSchema, 
          customFields: mappedCustomFields
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ [FieldStore] Falló el despacho del esquema masivo:', error);
      return false;
    } finally {
      set({ isSyncing: false });
    }
  }
}));
