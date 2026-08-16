/**
 * @file ChatApiClient.ts
 * @description Servicio cliente para conectar el Frontend con el Backend REST.
 * Aplica el patrón Adapter para aislar los detalles de comunicación de red.
 */

export interface ITokenMetricsDTO {
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly totalTokens: number;
  readonly estimatedCostUsd: number;
}

export interface IEngineResponseDTO {
  readonly chatType: 'FULL_JS' | 'HYBRID' | 'FULL_AI';
  readonly responseText: string;
  readonly executionTimeMs: number;
  readonly tokenMetrics?: ITokenMetricsDTO;
  readonly sourceContext?: string;
}

export interface IMultiChatApiResponseDTO {
  readonly success: boolean;
  readonly data?: {
    readonly chat1Js: IEngineResponseDTO;
    readonly chat2Hybrid: IEngineResponseDTO;
    readonly chat3FullAi: IEngineResponseDTO;
  };
  readonly error?: string;
}

export class ChatApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl = 'http://localhost:3014/api/v2/simulator') {
    this.baseUrl = baseUrl;
  }

  /**
   * Ejecuta la consulta sobre la API backend enviando el payload al orquestador.
   * 
   * @param tenantId Identificador del cliente/inquilino.
   * @param text Mensaje o pregunta ingresada por el usuario.
   * @param userPhone Teléfono o identificador de sesión.
   * @returns Promesa con los resultados consolidados de los motores.
   */
  public async executeChatRequest(
    tenantId: string,
    text: string,
    userPhone = 'SIMULATOR-USER'
  ): Promise<IMultiChatApiResponseDTO> {
    try {
      const response = await fetch(`${this.baseUrl}/multi-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          tenantId,
          text: text.trim(),
          userPhone,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error HTTP status: ${response.status}`);
      }

      const json = (await response.json()) as IMultiChatApiResponseDTO;
      return json;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error de conexión con el backend de IA';
      return {
        success: false,
        error: message,
      };
    }
  }
}

export const chatApiClient = new ChatApiClient();
