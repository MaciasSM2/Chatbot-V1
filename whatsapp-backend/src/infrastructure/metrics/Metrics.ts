import client from "prom-client";

// Configurar registro predeterminado
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Definir métricas personalizadas
export const messageCounter = new client.Counter({
  name: "chatbot_messages_received_total",
  help: "Total de mensajes de WhatsApp recibidos",
  labelNames: ["status"],
});

export const processingDuration = new client.Histogram({
  name: "chatbot_message_processing_duration_seconds",
  help: "Duración del procesamiento de mensajes en segundos",
  buckets: [0.1, 0.5, 1, 2, 5],
});

register.registerMetric(messageCounter);
register.registerMetric(processingDuration);

export default register;
