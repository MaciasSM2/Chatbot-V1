/**
 * @file PromptInjectionGuard.ts
 * @description Servicio perimetral encargado de sanitizar e inspeccionar el texto entrante de WhatsApp.
 * Protege al WelcomeOrchestrator y a la FSM de manipulaciones semánticas maliciosas.
 */
import logger from '../../infrastructure/logging/Logger';

export interface ISafetyVerdict {
  isSafe: boolean;
  violationType: 'NONE' | 'JAILBREAK_ATTEMPT' | 'INSTRUCTION_OVERRIDE' | 'CODE_INJECTION';
  sanitizedText: string;
}

export class PromptInjectionGuard {
  private readonly BLACKLISTED_PATTERNS: Array<{ regex: RegExp; type: ISafetyVerdict['violationType'] }> = [
    { 
      regex: /(olvida|ignora|bypass|override|ignore)\s+(las|tus)?\s*(instrucciones|directrices|reglas|prompts)/i, 
      type: 'INSTRUCTION_OVERRIDE' 
    },
    { 
      regex: /(actúa|com pórtate|simulate|respond)\s+como\s+(un)?\s*(administrador|root|desarrollador|sistema)/i, 
      type: 'JAILBREAK_ATTEMPT' 
    },
    { 
      regex: /(system\s*override|developer\s*mode|dan\s*mode|jailbreak)/i, 
      type: 'JAILBREAK_ATTEMPT' 
    },
    { 
      regex: /(drop\s+table|select\s+\*\s+from|delete\s+from|alter\s+table|<script)/i, 
      type: 'CODE_INJECTION' 
    }
  ];

  /**
   * Analiza el string enviado por el cliente y emite un veredicto de seguridad.
   */
  public evaluatePayloadSafety(incomingUserText: string): ISafetyVerdict {
    const trimmedInput = incomingUserText.trim();

    if (trimmedInput.length > 2000) {
      logger.warn('🚨 [Security Alert] Bloqueado mensaje de WhatsApp con longitud excesiva (+2000 caracteres).');
      return {
        isSafe: false,
        violationType: 'CODE_INJECTION',
        sanitizedText: trimmedInput.substring(0, 100) + '... [TRUNCATED_BY_FIREWALL]'
      };
    }

    for (const patternNode of this.BLACKLISTED_PATTERNS) {
      if (patternNode.regex.test(trimmedInput)) {
        logger.error(`🚨 [Prompt Injection DETECTED] Intento de vulneración perimetral. Tipo: ${patternNode.type}`, {
          violationPattern: patternNode.regex.toString(),
          capturedInput: trimmedInput
        });

        return {
          isSafe: false,
          violationType: patternNode.type,
          sanitizedText: '⚠️ *Alerta de Seguridad:* El mensaje enviado infringe las políticas operativas del bot.'
        };
      }
    }

    return {
      isSafe: true,
      violationType: 'NONE',
      sanitizedText: trimmedInput
    };
  }
}
