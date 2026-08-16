# 💬 ChatBot Modulo Saludo — Enterprise WhatsApp Platform v2.0.0

Plataforma empresarial de chatbot para WhatsApp con **Motor FSM Conversacional**, **Liquidación de Transporte SICE-TAC (Colombia)**, **IA Multimodelo (OpenAI / Gemini / Anthropic)**, **Indexación RAG**, **Dashboard en Tiempo Real (Next.js 15)** y **Arquitectura de Microservicios Resilientes**.

---

## 🏗️ Stack Tecnológico

| Capa | Tecnología | Descripción |
|---|---|---|
| **Frontend** | Next.js 15 (App Router), React 19, Tailwind CSS 4, Zustand 5 | Dashboard administrativo, chat interactivo y simulador multi-motor |
| **Backend** | Node.js 26, TypeScript 5.7, Express 5 | Núcleo de orquestación conversacional, middleware perimetral y API REST |
| **Colas & Asincronía** | BullMQ + Redis 7 | Tubería de mensajería desacoplada anti-picos de carga y rate-limiting |
| **Persistencia** | MariaDB 10.11 / MySQL 8 | Almacenamiento relacional de plantillas, clientes, mensajes y auditoría |
| **Tiempo Real** | Socket.IO 4.8 | Eventos bidireccionales `new_message`, `session_updated` y telemetría |
| **IA & RAG** | OpenAI (GPT-4o), Google Gemini 1.5, Anthropic Claude 3.5 | Inferencia multimodelo con parsing de documentos PDF/TXT y vectores |
| **Observabilidad** | Prometheus + Grafana 10 | Métricas de rendimiento, latencia HTTP, estado de colas y health checks |
| **Proxy & Despliegue** | Nginx + Docker Compose + Helm Charts | Proxy reverso con terminación SSL/TLS y orquestación containerizada |

---

## 📐 Arquitectura del Sistema

```text
[ CLIENTE EN WHATSAPP / WIDGET EMBED ]
         |
         v (Payload HTTP POST con Firma HMAC SHA-256)
+------------------------------------------------------------------+
| NGINX PROXY REVERSO (Puerto 80/443: Enmascara y enruta tráfico)  |
+----------------------------------+-------------------------------+
                                   |
                                   v (Backend Express 5)
+------------------------------------------------------------------+
| MIDDLEWARES DE DEFENSA:                                          |
|  1. CorrelationIdMiddleware ---> Estampa UUID único de rastreo   |
|  2. UnifiedSignatureValidator -> Valida autenticidad de Meta     |
|  3. RedisRateLimiterMiddleware -> Ventana deslizante anti-DoS    |
+----------------------------------+-------------------------------+
                                   |
                                   v (Asincronía desacoplada)
+------------------------------------------------------------------+
| EnqueueMessageUseCase ---> Empuja Job atómico a REDIS (BullMQ)   |
+----------------------------------+-------------------------------+
                                   |
                                   v (Worker Daemon en Background)
+------------------------------------------------------------------+
| MESSAGE WORKER DAEMON ---> Despierta de forma controlada         |
+----------------------------------+-------------------------------+
                                   |
                                   v (Estado Conversacional)
+------------------------------------------------------------------+
| HybridSessionRepository (Redis Cache Microsegundos + MariaDB)    |
+----------------------------------+-------------------------------+
                                   |
                                   v (Orquestación & IA)
+------------------------------------------------------------------+
| BILLING FSM ORCHESTRATOR / MULTI-LLM GATEWAY                     |
|  +-- PromptInjectionGuard ---> Sanitiza entrada                  |
|  +-- DateTimeManager --------> Evalúa feriados (Algoritmo Gauss) |
|  +-- SiceTacLiquidationEngine -> Cómputo oficial de fletes       |
+----------------------------------+-------------------------------+
                                   |
                                   v (Despacho de Eventos)
+------------------------------------------------------------------+
| DOMAIN EVENT BUS ---> SocketServer emite en tiempo real a Dashboard |
+------------------------------------------------------------------+
```

---

## ⚡ Inicio Rápido

### 1. Requisitos Previos
- Node.js >= 20.x
- Docker & Docker Compose (para despliegue completo)
- Redis 7.x y MariaDB 10.11+ (para ejecución local sin Docker)

### 2. Despliegue con Docker Compose (Recomendado)
```bash
# Copiar archivo de variables de entorno
cp .env.docker.example .env

# Levantar todo el stack
docker compose up -d --build

# Verificar salud de los contenedores
curl http://localhost/health
```

### 3. Ejecución en Desarrollo Local
```bash
# Backend (Puerto 3000)
cd whatsapp-backend
npm install
npm run dev

# Dashboard (Puerto 3015 / 3001)
cd whatsapp-dashboard
npm install
npm run dev
```

---

## 🧪 Pruebas y Control de Calidad

El proyecto cuenta con una suite completa de pruebas unitarias, de integración y pruebas B2B (Backend ↔ Frontend Contract Testing).

```bash
# Ejecutar todas las pruebas del backend (incluyendo la nueva suite B2B fullstack-contract)
cd whatsapp-backend
npm test

# Compilación TypeScript y chequeo de tipos estricto
npm run build
```

---

## 📌 Catálogo de Endpoints de la API REST

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/health` | Chequeo de vitalidad del sistema (MariaDB, Redis, Meta API) |
| `GET` | `/api/greetings` | Listado de plantillas de saludos dinámicos parametrizados |
| `GET` | `/api/admin/settings/brand` | Configuración de marca, tono y prompts de sistema |
| `GET` | `/api/admin/crm/clients` | Listado de clientes registrados en el CRM |
| `POST` | `/api/billing/calculate` | Cálculo de fletes oficial SICE-TAC según peso y ruta |
| `POST` | `/api/simulator/multi-chat` | Simulación simultánea de los 3 motores conversacionales |
| `POST` | `/webhook` | Recepción de webhooks con firma HMAC de Meta WhatsApp API |

---

## 📊 Matriz Estratégica de Sugerencias (Tres Pilares)

A continuación se presenta la tabla de recomendaciones estratégicas para evolucionar la plataforma en **Seguridad**, **Función** e **Interfaz**:

| Pilar | Área / Componente | Vulnerabilidad / Oportunidad | Acción Recomendada / Solución | Prioridad |
|---|---|---|---|---|
| 🔐 **Seguridad** | Webhook WhatsApp | Ausencia de filtrado IP para las peticiones entrantes de Meta | Implementar whitelist de rangos IP CIDR oficiales de Meta Graph API en Nginx / Middleware perimetral | 🔴 Alta |
| 🔐 **Seguridad** | Autenticación JWT | Sesiones JWT sin rotación dinámica ni revocación | Incorporar esquema OAuth2 con Refresh Tokens rotativos y tabla de revocación en Redis | 🔴 Alta |
| 🔐 **Seguridad** | Inserción RAG | Riesgo de Prompt Injection en documentos adjuntos subidos | Aplicar sanitización heurística previa a la vectorización de archivos en `OpenAiEmbeddingService` | 🟡 Media |
| ⚙️ **Función** | Máquina de Estados (FSM) | Posible pérdida de sesión en vuelo si el clúster de Redis cae | Implementar patrón *Write-Through* hacia MariaDB con fallback transparente en memoria LRU local | 🔴 Alta |
| ⚙️ **Función** | Motor SICE-TAC | Matrices de rutas y fletes estáticas en base de datos | Crear cron job / scraper automatizado que sincronice la tabla con las resoluciones del Ministerio de Transporte | 🟡 Media |
| ⚙️ **Función** | Multi-LLM Gateway | Conmutación manual si un proveedor de IA falla | Implementar balanceador automático de carga con failover dinámico (OpenAI ➔ Gemini ➔ Anthropic) | 🟢 Recomendado |
| 🎨 **Interfaz** | Dashboard Next.js | Ausencia de alertas emergentes cuando el operador no tiene la pestaña activa | Integrar Service Worker nativo (VAPID WebPush) para notificaciones de escritorio en tiempo real | 🟡 Media |
| 🎨 **Interfaz** | Chat Simulator | El simulador solo muestra texto simple sin rich media | Extender la vista para renderizar componentes ricos de WhatsApp (botones interactivos, plantillas, audios) | 🟢 Recomendado |
| 🎨 **Interfaz** | Personalización Dashboard | Las preferencias de temas visuales se pierden al reiniciar navegador | Persistir temas en `localStorage` y en `tenant_settings` para mantener la preferencia del usuario | 🟢 Recomendado |
