/**
 * @file HeuristicEngineService.ts
 * @description Servicio encargado de evaluar la complejidad semántica de un mensaje.
 * Determina algorítmicamente si la consulta puede ser resuelta en JavaScript o requiere IA.
 */

export interface IHeuristicVerdict {
  shouldTriggerAi: boolean;
  complexityScore: number; // Valor de 0.0 (Simple) a 1.0 (Muy Complejo)
  detectedReason: string;
}

export class HeuristicEngineService {
  // Expresiones regulares para detectar patrones que demandan razonamiento semántico
  private readonly COMPLEX_PATTERNS = [
    /\b(por qu[eé]|c[oó]mo funciona|expl[ií]came|diferencia|compara|ventajas|desventajas)\b/i,
    /\b(necesito un consejo|qu[eé] me recomiendas|depende de|en caso de que)\b/i,
    /\b(reclamo|queja|inconformidad|mal servicio|devoluci[oó]n de dinero)\b/i,
  ];

  /**
   * Evalúa un texto entrante y retorna un veredicto con el puntaje de complejidad.
   * 
   * @param userText Mensaje enviado por el usuario.
   * @param customThreshold Umbral del Tenant (Default: 0.5).
   */
  public evaluateComplexity(userText: string, customThreshold = 0.5): IHeuristicVerdict {
    const trimmedInput = userText.trim();
    if (trimmedInput.length === 0) {
      return { shouldTriggerAi: false, complexityScore: 0, detectedReason: 'ENTRADA_VACIA' };
    }

    let score = 0.0;
    const reasons: string[] = [];

    // 1. Evaluación por longitud del texto (Entradas largas suelen requerir IA)
    if (trimmedInput.length > 120) {
      score += 0.3;
      reasons.push('LONGITUD_EXCESIVA');
    }

    // 2. Evaluación por palabras complejas o intenciones abiertas
    for (const pattern of this.COMPLEX_PATTERNS) {
      if (pattern.test(trimmedInput)) {
        score += 0.4;
        reasons.push('PATRON_ANALITICO_DETECTADO');
        break; // Evitar acumulación redundante
      }
    }

    // 3. Evaluación de signos de interrogación múltiples o estructura compleja
    const questionMarks = (trimmedInput.match(/\?/g) || []).length;
    if (questionMarks > 1) {
      score += 0.2;
      reasons.push('MULTIPLE_INTERROGACION');
    }

    const finalScore = Math.min(1.0, score);
    const shouldTriggerAi = finalScore >= customThreshold;

    return {
      shouldTriggerAi,
      complexityScore: Number(finalScore.toFixed(2)),
      detectedReason: reasons.length > 0 ? reasons.join(' | ') : 'DETERMINISTA_SIMPLE',
    };
  }

  /**
   * Método evaluate compatible con la versión anterior para no romper BotEngineService.ts.
   */
  public evaluate(userMessage: string, rules: any[], umbral: number): {
    shouldTriggerAI: boolean;
    matchedRule?: any;
    reason: string;
  } {
    const cleanMsg = userMessage.trim().toLowerCase();
    const matchedRule = rules.find(r => r.palabras_clave.some((kw: string) => cleanMsg.includes(kw.trim().toLowerCase())));

    // Si la longitud supera el umbral o no hay regla coincidente, dispara la IA
    const shouldTriggerAI = userMessage.length > umbral || !matchedRule;

    return {
      shouldTriggerAI,
      matchedRule,
      reason: shouldTriggerAI 
        ? `Longitud de mensaje (${userMessage.length}) supera umbral (${umbral}) o no se encontró regla determinista.` 
        : 'Mensaje corto resuelto por regla determinista en JS.'
    };
  }
}
