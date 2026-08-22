# 📡 Referencia Oficial de la API REST y Eventos WebSocket

> **Especificación Completa de Endpoints, Métodos HTTP, Payloads y Eventos en Tiempo Real**  
> *Versión 2.0.0 — OpenAPI / REST Specification*

---

## 🌐 1. Resumen de Convenciones y Autenticación

- **Base URL (Local / Docker)**: `http://localhost:3014/api` (o vía Nginx `http://localhost/api`)
- **Autenticación**:
  - Rutas Públicas / Webhook: Cabecera HMAC `X-Hub-Signature-256` firmada con `APP_SECRET`.
  - Rutas Administrativas: Cabecera `Authorization: Bearer <JWT_TOKEN>` o Cookies `HttpOnly`.
- **Identificador de Rastreo**: Cabecera opcional `X-Correlation-ID` (se genera automáticamente si no se envía).
- **Formato de Respuesta Estándar**:
  ```json
  {
    "success": true,
    "data": {},
    "timestamp": "2026-08-22T14:00:00.000Z",
    "correlationId": "uuid-v4-tracker"
  }
  ```

---

## 📋 2. Catálogo de Endpoints REST

### A. Diagnóstico y Salud del Sistema

#### `GET /health`

Verifica la vitalidad del backend y de sus dependencias críticas.

- **Respuesta 200 OK**:

  ```json
  {
    "status": "HEALTHY",
    "uptime": 12450.32,
    "database": { "status": "CONNECTED", "latencyMs": 1.2 },
    "redis": { "status": "CONNECTED", "latencyMs": 0.4 },
    "circuitBreaker": { "state": "CLOSED", "consecutiveFailures": 0 }
  }
  ```

#### `GET /metrics`

Expone métricas oficiales en formato estándar Prometheus para recolección periódica.

---

### B. Webhook Oficial de Meta WhatsApp Cloud API

#### `GET /api/webhook`

Handshake de validación de Meta Developers al configurar el Webhook.

- **Query Params**: `hub.mode=subscribe`, `hub.challenge=1158201444`, `hub.verify_token=<META_VERIFY_TOKEN>`
- **Respuesta**: `hub.challenge` (texto plano) con status `200 OK`.

#### `POST /api/webhook`

Recepción de eventos de mensajería entrantes con firma criptográfica.

- **Headers Obligatorios**: `X-Hub-Signature-256: sha256=<HMAC_HASH>`
- **Body**: Payload estándar de Meta Graph API v21.0.
- **Respuesta**: `200 OK` (procesamiento asíncrono en BullMQ en < 2ms).

---

### C. Módulo Administrativo y CRM

| Método | Endpoint | Descripción | Requiere Auth |
|---|---|---|---|
| `GET` | `/api/admin/crm/clients` | Listado paginado de clientes registrados | Sí (JWT) |
| `POST` | `/api/admin/crm/clients` | Creación manual de un nuevo cliente | Sí (JWT) |
| `PUT` | `/api/admin/crm/clients/:id` | Actualización de perfil del cliente | Sí (JWT) |
| `POST` | `/api/admin/crm/clients/upload-rut` | Carga binaria y validación de documento RUT | Sí (JWT) |
| `GET` | `/api/admin/settings/brand` | Obtiene nombre de marca, logotipo y tono | Sí (JWT) |
| `PUT` | `/api/admin/settings/brand` | Actualiza la configuración de marca | Sí (JWT) |
| `PATCH` | `/api/admin/settings/brand/tone` | Modifica el tono conversacional (Formal / Casual / Dinámico) | Sí (JWT) |
| `GET` | `/api/admin/queues/stats` | Telemetría en tiempo real de colas BullMQ | Sí (JWT) |
| `POST` | `/api/admin/queues/purge-failed` | Limpieza forzada de trabajos estancados | Sí (JWT) |

---

### D. Motor de Saludos y Plantillas Dinámicas

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/greetings` | Lista todas las plantillas de saludo parametrizadas |
| `POST` | `/api/greetings` | Crea una nueva regla de saludo (franja horaria / día festivo) |
| `PUT` | `/api/greetings/:id` | Actualiza texto o variables dinámicas de la plantilla |
| `DELETE` | `/api/greetings/:id` | Elimina una plantilla |

---

### E. Simulación y Testing Multimotor

#### `POST /api/simulator/multi-chat`
Ejecuta la misma consulta del usuario contra los 3 motores conversacionales para comparar respuestas en el Dashboard.
- **Body**:
  ```json
  {
    "message": "Hola, cuánto cuesta enviar 10 toneladas de Medellín a Cartagena?",
    "engines": ["FSM_DETERMINISTIC", "OPENAI_GPT4O", "GEMINI_15"]
  }
  ```
- **Respuesta 200 OK**:
  ```json
  {
    "fsm": { "response": "El costo oficial SICE-TAC es $3,250,000 COP...", "latencyMs": 4 },
    "openai": { "response": "Con gusto te cotizo...", "latencyMs": 620 },
    "gemini": { "response": "Estimado cliente...", "latencyMs": 480 }
  }
  ```

---

## ⚡ 3. Eventos en Tiempo Real (Socket.IO)

El servidor emite eventos bidireccionales en el namespace raíz `/`:

| Nombre del Evento | Dirección | Descripción del Payload |
|---|---|---|
| `new_message` | Servidor ➔ Cliente | Notifica un mensaje entrante de WhatsApp o salida del bot con metadatos |
| `session_updated` | Servidor ➔ Cliente | Informa cambios de estado en la FSM de un usuario específico |
| `circuit_breaker_alert`| Servidor ➔ Cliente | Alerta de apertura (`OPEN`) o cierre (`CLOSED`) del Circuit Breaker |
| `queue_telemetry` | Servidor ➔ Cliente | Conteo en tiempo real de jobs procesados, activos y fallidos |
