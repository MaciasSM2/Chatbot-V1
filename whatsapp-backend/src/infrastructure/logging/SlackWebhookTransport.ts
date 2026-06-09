/**
 * @file SlackWebhookTransport.ts
 * @description Transporte personalizado de Winston para el desvío instantáneo de excepciones críticas.
 * Enlaza los fallos de infraestructura directamente con los canales de comunicación de ingeniería.
 */
import Transport from 'winston-transport';

interface SlackTransportOptions extends Transport.TransportStreamOptions {
  webhookUrl: string;
}

export class SlackWebhookTransport extends Transport {
  private readonly webhookUrl: string;

  constructor(options: SlackTransportOptions) {
    super(options);
    this.webhookUrl = options.webhookUrl || process.env.EMERGENCY_SLACK_WEBHOOK || '';
  }

  /**
   * Intercepta el log emitido por Winston y despacha la notificación cifrada si cumple el umbral.
   */
  public override log(info: any, next: () => void): void {
    // Llamar next() síncronamente para no bloquear el pipeline de Winston
    next();

    if (!this.webhookUrl || info.level !== 'error') {
      return;
    }

    setImmediate(async () => {
      const correlationId = info.correlationId || 'N/A';
      const timestamp = new Date().toISOString();

      const slackPayload = {
        attachments: [
          {
            color: '#EF4444',
            title: `🚨 ALERTA DE INFRAESTRUCTURA - MONOREPO CHATBOT (2026)`,
            fields: [
              { title: 'Mensaje de Excepción', value: `\`\`\`${info.message}\`\`\``, short: false },
              { title: 'Módulo / Contexto', value: info.module || 'NUL_CONTEXT', short: true },
              { title: 'Correlation ID (Fase 66)', value: `\`${correlationId}\``, short: true },
              { title: 'Huso Horario Operativo', value: timestamp, short: true },
              { title: 'Entorno de Ejecución', value: process.env.NODE_ENV || 'production', short: true }
            ],
            footer: 'Núcleo de Resiliencia y Mitigación de Fallos Logísticos'
          }
        ]
      };

      try {
        const networkController = new AbortController();
        const timeoutId = setTimeout(() => networkController.abort(), 4000);
        await fetch(this.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(slackPayload),
          signal: networkController.signal
        });
        clearTimeout(timeoutId);
      } catch {
        // Silenciar errores de red del transport — no impactar el proceso principal
      }
    });
  }
}
