const API_BASE_URL = typeof window !== 'undefined'
  ? '/api'
  : (process.env.NEXT_PUBLIC_API_URL || 'http://whatsapp-backend:3014/api');

export interface IApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export function getApiUrl(subPath?: string): string {
  if (!subPath) return API_BASE_URL;
  const cleanPath = subPath.startsWith('/') ? subPath : `/${subPath}`;
  return `${API_BASE_URL}${cleanPath}`;
}

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export class ClientNetworkException extends ApiError {
  constructor(
    public readonly statusCode: number,
    public readonly userFriendlyMessage: string,
    public readonly detailedError: string
  ) {
    super(userFriendlyMessage, statusCode);
    Object.setPrototypeOf(this, ClientNetworkException.prototype);
  }
}

export async function executeSecureRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<IApiResponse<T>> {
  const url = endpoint.startsWith('/api/') || endpoint.startsWith('http')
    ? endpoint
    : getApiUrl(endpoint);

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  };

  const configuredOptions: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers as Record<string, string> || {})
    }
  };

  try {
    const networkResponse = await fetch(url, configuredOptions);

    if (networkResponse.status === 401) {
      console.warn('🔌 Sesión inválida en el perímetro.');
      return { success: false, error: 'Credenciales inválidas.' };
    }

    const jsonParsed = await networkResponse.json();

    if (!networkResponse.ok) {
      return {
        success: false,
        error: jsonParsed.error || `Error de servidor: ${networkResponse.status}`
      };
    }

    return jsonParsed && typeof jsonParsed === 'object' && jsonParsed.success === true
      ? jsonParsed
      : jsonParsed && typeof jsonParsed === 'object' && 'error' in jsonParsed
        ? { success: false, error: jsonParsed.error }
        : { success: true, data: jsonParsed };

  } catch (networkError: any) {
    console.error(`🚨 [Network Fail] No se pudo conectar a ${url}:`, networkError);
    return {
      success: false,
      error: 'Error de conectividad perimetral.'
    };
  }
}
