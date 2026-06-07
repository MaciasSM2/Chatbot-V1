export function getApiUrl(subPath: string = ''): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
  const apiBase = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
  return subPath ? `${apiBase}/${subPath.replace(/^\//, '')}` : apiBase;
}

export interface IApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
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
  options: RequestInit & { timeout?: number } = {}
): Promise<IApiResponse<T>> {
  const { timeout = 15000, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(endpoint, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'NextJs_Admin_Console',
        ...fetchOptions.headers
      },
      signal: controller.signal,
    });

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      const preview = await response.text().catch(() => '');
      throw new ClientNetworkException(
        response.status,
        `Respuesta inesperada del servidor (${response.status})`,
        `Expected JSON but got ${preview.startsWith('<!') ? 'HTML' : contentType || 'unknown'}`
      );
    }

    const json: IApiResponse<T> = await response.json();

    if (!response.ok) {
      throw new ApiError(json.error || `HTTP ${response.status}`, response.status);
    }

    return json;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    if (error.name === 'AbortError') {
      throw new ClientNetworkException(408, 'El servidor no respondió a tiempo. Verifica que el backend esté corriendo.', 'Network_Timeout');
    }
    throw new ClientNetworkException(503, 'No se puede conectar con el servidor. Verifica que el backend esté funcionando.', error.message);
  } finally {
    clearTimeout(timeoutId);
  }
}
