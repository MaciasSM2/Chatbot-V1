# Fase Bonus 88 — Mapa de Flujo de Datos Extremo (End-to-End Core Data Architectural Blueprint)

```text
[ CLIENTE EN WHATSAPP ]
         |
         v (Payload HTTP POST con Firma HMAC SHA-256)
+------------------------------------------------------------------+
| NGINX PROXY REVERSO (Puerto 80: Enmascara y enruta trafico WAN) |
+----------------------------------+-------------------------------+
                                   |
                                   v (Frontera Perimetral del Backend Express 5)
+------------------------------------------------------------------+
| MIDDLEWARES DE DEFENSA:                                          |
|  1. CorrelationIdMiddleware ---> Estampa UUID unico de rastreo   |
|  2. UnifiedSignatureValidator -> Valida autenticidad de Meta     |
|  3. RedisRateLimiterMiddleware -> Ventana deslizante anti-DoS    |
+----------------------------------+-------------------------------+
                                   |
                                   v (Asincronia y Desacoplamiento de Carga)
+------------------------------------------------------------------+
| EnqueueMessageUseCase ---> Empuja Job atomico a REDIS (BullMQ)   |
+----------------------------------+-------------------------------+
                                   |
                                   v (Hilo de Ejecucion Secundario en Background)
+------------------------------------------------------------------+
| MESSAGE WORKER DAEMON ---> Despierta de forma controlada en CPU  |
+----------------------------------+-------------------------------+
                                   |
                                   v (Interrogacion del Estado Conversacional)
+------------------------------------------------------------------+
| HybridSessionRepository                                          |
|  +-- Capa 1: Redis Cache ---> (Hit de velocidad en microsegundos)|
|  +-- Capa 2: MariaDB -------> (Cache-Aside de re-hidratacion)    |
+----------------------------------+-------------------------------+
                                   |
                                   v (Resolucion Semantica y Reglas de Negocio)
+------------------------------------------------------------------+
| BILLING FSM ORCHESTRATOR                                         |
|  +-- PromptInjectionGuard ---> Sanitiza texto libre contra Jail- |
|  +-- DateTimeManager --------> Evalua feriados (Algoritmo Gauss) |
|  +-- SiceTacLiquidationEngine -> Computo doble capa de fletes    |
+----------------------------------+-------------------------------+
                                   |
                                   v (Despacho Desacoplado de Resultados)
+------------------------------------------------------------------+
| IN-MEMORY DOMAIN EVENT BUS                                       |
|  +-- SocketServer ------------> Emite payload en tiempo real a UI|
|  +-- WebPushNotificationGateway -> Despierta Service Worker (VAPID)|
|  +-- WhatsAppOutboundService ---> Circuit Breaker CLOSED?        |
|          +-- SI --------------> Despacha bytes a Meta API v21.0  |
|          +-- NO --------------> Desvia a MariaDB (RetryScheduler)|
+------------------------------------------------------------------+
```
