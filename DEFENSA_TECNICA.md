# Fase Bonus 85 — Simulador de Defensa Técnica ante el Jurado

## Tabla de Respuestas Tácticas

| Pregunta del Jurado | Tu Respuesta Técnica | Justificación de Ingeniería |
|---|---|---|
| **¿Por qué usaron una arquitectura relacional (MariaDB) y una NoSQL (Redis) juntas en lugar de una sola base de datos?** | "Implementamos un **Esquema de Persistencia Híbrida**. Redis actúa como una memoria caché intermedia de baja latencia y bróker de colas asíncronas con BullMQ para procesar webhooks en microsegundos. MariaDB es nuestra ancla transaccional con integridad referencial (ACID) para el CRM y el histórico financiero de fletes." | Alta cohesión, tolerancia a fallos y mitigación de cuellos de botella por operaciones I/O en el disco. |
| **Si la API de Meta (WhatsApp) experimenta una caída global, ¿el bot colapsa o pierde datos?** | "No. Implementamos el patrón **Circuit Breaker** mediante un cortafuegos de resiliencia distribuida. Si Meta falla de forma consecutiva, el circuito cambia a estado `OPEN` y desvía las solicitudes a una cola de contingencia en MariaDB. Un demonio en background reconcilia las colas automáticamente cuando el canal WAN se estabiliza." | Resiliencia autónoma sin pérdida de notificaciones logísticas. |
| **¿Cómo garantizan que el procesamiento masivo de mensajes de WhatsApp no congele la interfaz web o el servidor?** | "El backend desacopla la recepción HTTP del procesamiento a través de **BullMQ**. El webhook recibe el byte de Meta, valida la firma criptográfica HMAC y lo encola de inmediato en Redis (operación que tarda menos de 2ms). Un hilo secundario operado por el `MessageWorker` consume las tareas de forma controlada." | Aislamiento del *Event Loop* de Node.js ante inundaciones masivas DoS. |
| **¿Qué medidas de seguridad perimetral implementaron para mitigar vulnerabilidades OWASP?** | "Saneamos la frontera perimetral en tres capas: validación estricta de entornos con Zod, cifrado transparente **AES-256-GCM** para los documentos de identidad (Habeas Data), cookies de sesión configuradas exclusivamente como `HttpOnly; Secure; SameSite=Strict` contra ataques XSS/CSRF, y un cortafuegos heurístico contra inyecciones de prompts." | Inmunización perimetral de datos en reposo y en tránsito. |

---

## Consejo del Tech Lead

Si el jurado te pregunta por qué decidiste estructurar el proyecto como un **Monorepo con Workspaces**, responde con seguridad:

> *"Garantiza un control de versiones unificado, permitiendo compartir contratos e interfaces de tipado estrictas entre el backend de Express 5 y el frontend de Next.js, acelerando el ciclo de compilación y empaquetado atómico dentro de la infraestructura de Docker".*
