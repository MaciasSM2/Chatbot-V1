/**
 * @file CrmNetworkContracts.ts
 * @description Contratos de tipado estricto para las respuestas de la API del CRM.
 * Evita excepciones runtime tras la activación del modo strict: true en Next.js.
 */

export interface IClientCrmEntity {
  phone_number: string;
  full_name: string | null; // Tipado explícito nulleable alineado a la columna física de MariaDB
  gender: 'M' | 'F' | 'N';
  document_type: 'CC' | 'NIT' | 'CE' | null;
  document_number: string | null;
  is_paused: number; // 0 o 1 en la base de datos relacional
  rut_file_path: string | null;
  created_at: string;
}

export interface CrmApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
