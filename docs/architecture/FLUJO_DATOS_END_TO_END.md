# 🔄 Flujo de Datos End-to-End y Tubería Asíncrona

> **Recorrido Integral del Mensaje: Desde la Recepción en Nginx hasta la Emisión WebSocket y WhatsApp**  
> *Versión 2.0.0 — Arquitectura de Tubería Asíncrona con BullMQ*

---

## 🗺️ 1. Diagrama de Flujo de Datos Arquitectónico

```text
[ 1. CLIENTE EN WHATSAPP / SIMULADOR ]
                 │
                 ▼ (Payload HTTP POST con cabecera X-Hub-Signature-256)
+─────────────────────────────────────────────────────────────────────────────+
| [ 2. NGINX PROXY REVERSO ] (Puertos 80 / 443)                                |
|  - Terminación SSL/TLS                                                      |
|  - Rate-limit de conexión y enrutamiento hacia upstream Node.js             |
+──────────────────────────────────────┬──────────────────────────────────────+
                                       │
                                       ▼ (Backend Express 5)
+─────────────────────────────────────────────────────────────────────────────+
| [ 3. MIDDLEWARES DE DEFENSA PERIMETRAL ]                                    |
|  a. CorrelationIdMiddleware  ───► Inyecta UUID único `X-Correlation-ID`     |
|  b. UnifiedSignatureValidator ──► Cómputo HMAC SHA-256 (Timing-Safe)        |
|  c. RedisRateLimiterMiddleware ─► Ventana deslizante por IP / Teléfono      |
+──────────────────────────────────────┬──────────────────────────────────────+
                                       │
                                       ▼ (Desacoplamiento Inmediato)
+─────────────────────────────────────────────────────────────────────────────+
| [ 4. WEBHOOK CONTROLLER ] ──► Responde `HTTP 200 OK` a Meta en < 2ms         |
|  - EnqueueMessageUseCase empuja el Job a REDIS (Cola BullMQ)                |
+──────────────────────────────────────┬──────────────────────────────────────+
                                       │
                                       ▼ (Hilo Asíncrono en Background)
+─────────────────────────────────────────────────────────────────────────────+
| [ 5. MESSAGE WORKER DAEMON ] ──► Despierta de forma controlada              |
|  - Deserializa payload y extrae metadatos                                   |
+──────────────────────────────────────┬──────────────────────────────────────+
                                       │
                                       ▼ (Gestión de Sesión)
+─────────────────────────────────────────────────────────────────────────────+
| [ 6. HYBRID SESSION REPOSITORY ]                                            |
|  - L1: Redis Cache (Microsegundos)                                          |
|  - L2: MariaDB Relacional (Cache-Aside de contingencia)                      |
+──────────────────────────────────────┬──────────────────────────────────────+
                                       │
                                       ▼ (Lógica de Negocio Determinista)
+─────────────────────────────────────────────────────────────────────────────+
| [ 7. BILLING FSM ORCHESTRATOR & IA GATEWAY ]                                |
|  - PromptInjectionGuard ───► Sanitiza entradas de texto libre                |
|  - ColombiaHolidayProvider ─► Evalúa festivos (Algoritmo de Gauss)          |
|  - SiceTacLiquidationEngine ─► Calcula flete oficial regulado               |
+──────────────────────────────────────┬──────────────────────────────────────+
                                       │
                                       ▼ (Despacho de Eventos)
+─────────────────────────────────────────────────────────────────────────────+
| [ 8. DOMAIN EVENT BUS ]                                                     |
|  ├──► SocketServer ─────────────► Emite evento `new_message` a Dashboard UI |
|  ├──► AuditLogger ──────────────► Registra traza transaccional en MariaDB    |
|  └──► WhatsAppOutboundService ──► Evalúa estado del Circuit Breaker:         |
|            ├── ESTADO CLOSED ───► Despacha bytes a Meta Graph API v21.0     |
|            └── ESTADO OPEN   ───► Guarda en cola de diferidos para Retry    |
+─────────────────────────────────────────────────────────────────────────────+
```

---

## ⚡ 2. Etapas Detalladas de la Tubería

### Fase A: Recepción y Blindaje (0 ms – 2 ms)
1. **Nginx** recibe la conexión HTTPS y valida encabezados perimetrales.
2. **CorrelationIdMiddleware** genera un UUID v4 o propaga el existente (`X-Correlation-ID`).
3. **UnifiedSignatureValidator** computa `crypto.createHmac('sha256', APP_SECRET)` sobre el buffer raw del body y lo compara con `crypto.timingSafeEqual` para prevenir ataques de temporización.
4. El controlador de webhook delega a `EnqueueMessageUseCase` y responde inmediatamente con un código `200 OK` para que Meta no reintente la entrega.

### Fase B: Procesamiento Asíncrono en Colas BullMQ (2 ms – 50 ms)
1. El **MessageWorker** consume el job de la cola de Redis.
2. Se recupera el contexto de la conversación desde el **HybridSessionRepository**.
3. Se invoca a la Máquina de Estados Finitos (`BotStateMachine.transition`).

### Fase C: Ejecución de Reglas de Negocio y Liquidación
1. Si el estado actual es captura de datos, se valida cédula/NIT y se cifra en repositorio MariaDB con **AES-256-GCM**.
2. Si el estado es liquidación SICE-TAC, el motor calcula el costo de la ruta y peajes.
3. Si el usuario realiza una pregunta abierta, se deriva al **MultiLlmGateway** (OpenAI / Gemini / Anthropic) previa sanitización por el **PromptInjectionGuard**.

### Fase D: Despacho Dual (WebSocket + Outbound)
1. Se publica un evento en el **DomainEventBus**.
2. El servidor de **Socket.IO** difunde el mensaje en tiempo real al panel administrativo Next.js.
3. El servicio **WhatsAppOutboundService** verifica el **AdvancedCircuitBreaker**:
   - Si el circuito está saludable (`CLOSED`), envía el mensaje a la API de WhatsApp de Meta.
   - Si la API externa está fallando (`OPEN`), almacena el mensaje en la tabla `deferred_outbound_messages` para reintentarlo de forma autónoma.
