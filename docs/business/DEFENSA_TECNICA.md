# 🛡️ Guía de Defensa Técnica ante Jurados y Auditores de Arquitectura

> **Banco de Preguntas Críticas y Respuestas Tácticas de Ingeniería de Software**  
> *Plataforma ChatBot WhatsApp v2.0.0 — Estándar Enterprise*

---

## 📋 Matriz de Preguntas y Respuestas Tácticas

| Pregunta del Jurado / Auditor | Respuesta Técnica | Justificación de Ingeniería |
|---|---|---|
| **1. ¿Por qué implementaron una persistencia híbrida (MariaDB + Redis) en lugar de una sola base de datos?** | *"Separamos responsabilidades de lectura/escritura y estados efímeros. **Redis** gestiona sesiones de usuario en microsegundos y actúa como bróker de colas en memoria con **BullMQ** para absorber picos de tráfico. **MariaDB** proporciona consistencia ACID, integridad referencial y almacenamiento permanente para clientes, cotizaciones y registros de auditoría."* | Alta cohesión, tolerancia a fallos, cero cuellos de botella por I/O de disco y soporte de cargas masivas de mensajería. |
| **2. Si la API de Meta (WhatsApp) experimenta una caída global, ¿el bot colapsa o pierde datos?** | *"No. Implementamos el patrón **Circuit Breaker**. Si Meta arroja errores consecutivos o timeouts, el circuito transiciona a estado `OPEN`, desactivando llamadas fallidas a la WAN y enrutando los mensajes a una tabla de contingencia en MariaDB. Un demonio autónomo (`RetryScheduler`) reintenta el despacho con backoff exponencial al restablecerse el canal."* | Resiliencia distribuida, prevención del fenómeno *cascading failure* y cero pérdida de leads o cotizaciones. |
| **3. ¿Cómo garantizan que un ataque de mensajes masivos no congele el Event Loop de Node.js?** | *"Aplicamos desacoplamiento total en el endpoint del webhook: al recibir el payload, se valida la firma HMAC y se empuja inmediatamente como un Job a Redis vía BullMQ, respondiendo `HTTP 200 OK` en < 2ms. El procesamiento pesado (FSM, IA, consultas SICE-TAC) se ejecuta en un hilo secundario por el `MessageWorker`."* | Aislamiento del *Event Loop*, absorción elástica de tráfico y mitigación de ataques DoS/inundación. |
| **4. ¿Qué medidas de ciberseguridad protegen los datos personales y el sistema contra vulnerabilidades OWASP?** | *"Implementamos un cinturón de seguridad en 4 capas: (1) Validación estricta de esquemas de entorno y payloads con **Zod**, (2) Cifrado transparente **AES-256-GCM** para documentos de identidad (Habeas Data), (3) Rate limiter perimetral con ventana deslizante en Redis, y (4) Cortafuegos heurístico (`PromptInjectionGuard`) para sanitizar entradas antes de enviarlas a LLMs."* | Cumplimiento estricto de la Ley 1581 de Habeas Data, prevención de OWASP Top 10 (Injection, Broken Auth, SSRF) y sanitización de prompts. |
| **5. ¿Por qué utilizar una Máquina de Estados Finitos (FSM) combinada con IA en lugar de un agente 100% LLM?** | *"Las cotizaciones logísticas y el cumplimiento SICE-TAC exigen **determinismo absoluto (0% de margen de error)**. Un LLM puro puede alucinar valores de fletes o saltarse la captura obligatoria de la cédula. La FSM controla el flujo determinista y las reglas de negocio, mientras que la IA multimodelo (OpenAI / Gemini / Claude) se delega exclusivamente a responder dudas libres de soporte."* | Cumplimiento regulatorio estricto, precisión matemática garantizada y control total sobre el costo de tokens de IA. |
| **6. ¿Por qué estructuraron el proyecto como un Monorepo con Workspaces de npm?** | *"El monorepo permite versionamiento atómico de contratos de datos entre el backend de Express 5 y el frontend de Next.js 15, reutilización de tipos TypeScript, optimización de pipelines de CI/CD y despliegue coordinado en Docker Compose sin desfases de versión."* | Coherencia en contratos de API, reducción de duplicación de código y simplificación del ciclo de vida DevOps. |

---

## 🏛️ Decisiones Arquitectónicas Justificadas (ADRs Rápidos)

### ADR-01: Express 5 vs NestJS / Fastify
- **Decisión**: Se eligió **Express 5** junto a un contenedor de Inversión de Control nativo (`AppContainer`) y Clean Architecture.
- **Razón**: Permite control granular sobre el ciclo de vida de middlewares perimetrales (HMAC SHA-256 sin deserialización prematura de `req.body`), menor sobrecarga de memoria y arranque en frío instantáneo.

### ADR-02: Next.js 15 (App Router) + Tailwind CSS 4 + Zustand 5
- **Decisión**: Frontend desacoplado con Server Components y Zustand para gestión de estado en tiempo real.
- **Razón**: Renderizado ultrarrápido, cero overhead de re-renderizado en chats concurrentes mediante WebSockets y diseño modular de marca blanca.

### ADR-03: BullMQ + Redis 7 para Tuberías de Mensajería
- **Decisión**: Procesamiento basado en colas asíncronas con reintentos configurables y manejo de trabajos estancados.
- **Razón**: Desacopla la latencia de APIs externas (Meta Graph API / OpenAI) de la experiencia del cliente y previene saturación de recursos.
