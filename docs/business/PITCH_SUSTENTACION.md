# 🎤 Guía de Sustentación y Master Pitch (10 Minutos)

> **Estructura de Presentación Comercial y Técnica de Alto Impacto**  
> *Dirigido a: Jurados Evaluadores, Comités Técnicos y Clientes Potenciales*

---

## ⏱️ Minuto 0–2: El Problema Logístico y el Enfoque de Negocio

### 🗣️ Qué decir:
> *"El principal cuello de botella de las empresas de transporte de carga pesada en Colombia es la alta latencia en la cotización de fletes y la rigidez de los canales tradicionales. Un cliente promedio cotiza con 3 empresas al mismo tiempo; quien responda primero con un valor exacto y regulado se queda con el viaje.*
>
> *Desarrollamos una plataforma empresarial de marca blanca que automatiza el saludo contextual, la captura legal de datos de identidad (Habeas Data) y la liquidación precisa de fletes bajo la normativa oficial SICE-TAC directamente en WhatsApp, disponible 24/7 sin intervención humana obligatoria."*

### 🖥️ Qué mostrar:
- **Dashboard Principal (`/admin/inicio`)**: Mostrar métricas de conversión, volumen neto cotizado y tiempos de respuesta de milisegundos.

---

## ⏱️ Minuto 2–5: Demostración de la FSM y el Motor SICE-TAC (El Núcleo)

### 🗣️ Qué decir:
> *"A diferencia de chatbots genéricos que sufren de alucinaciones en cálculos matemáticos, implementamos un **Motor Híbrido Determinista**. La conversación es gobernada por una Máquina de Estados Finitos (FSM) polimórfica de 7 estados con el patrón Strategy.*
>
> *Al liquidar un flete, el sistema ejecuta la fórmula oficial del Ministerio de Transporte (Resolución 20213040034345) a través de un sistema de persistencia y caché multinivel: resuelve en memoria RAM local en 0ms las rutas de alta frecuencia, consulta Redis en microsegundos y consolida en MariaDB. Además, cuenta con un motor de cálculo de festivos basado en el algoritmo de Gauss (Ley Emiliani) para aplicar recargos regulatorios en tiempo real."*

### 🖥️ Qué mostrar:
- **Simulador Interactivo de Chat (`/muestra`)**: Ejecutar una cotización en vivo seleccionando ruta (ej. *Medellín ➔ Cartagena*) y vehículo (Tractocamión 3S3).
- **Panel de Inspección en Vivo (`LiveDebugSidebar`)**: Mostrar el cambio de estado de la FSM y la inyección temática.

---

## ⏱️ Minuto 5–8: Arquitectura Cloud-Native y Blindaje Perimetral

### 🗣️ Qué decir:
> *"La plataforma fue concebida bajo arquitectura Cloud-Native y principios de Clean Architecture. Todo el sistema corre aislado en una red privada de Docker, protegido por un proxy reverso Nginx.*
>
> *Implementamos cuatro capas de seguridad estricta: validación criptográfica de firmas HMAC SHA-256 para mensajes de Meta, rate-limiting distribuido en Redis con ventana deslizante contra ataques DoS, cortafuegos heurístico contra inyecciones de prompts en LLMs, y cifrado transparente AES-256-GCM para documentos de identidad (Habeas Data) en reposo."*

### 🖥️ Qué mostrar:
- **Vista de Configuración y Seguridad (`/admin/configuracion`)**: Mostrar parámetros de seguridad perimetral, tokens y modelos de IA configurados.
- **Terminal de despliegue**: Demostrar contenedores activos (`docker compose ps`) y logs estructurados con UUID de correlación.

---

## ⏱️ Minuto 8–10: Resiliencia Avanzada, Telemetría y Cierre

### 🗣️ Qué decir:
> *"Para garantizar tolerancia a fallos en producción, el backend desacopla la recepción de mensajes mediante colas asíncronas con BullMQ y Redis. Si la API de Meta WhatsApp experimenta caídas externas, un **Circuit Breaker** entra en estado `OPEN`, reteniendo los mensajes en MariaDB para que un demonio autónomo de reconciliación los reenvíe sin pérdida de datos.*
>
> *La plataforma cuenta con instrumentación completa de Prometheus y Grafana, WebSockets para actualización en tiempo real en el Dashboard y soporte multi-modelo de IA (OpenAI GPT-4o, Google Gemini 1.5, Anthropic Claude 3.5). Está lista para operar como producto SaaS escalable."*

### 🖥️ Qué mostrar:
- **Panel de CRM y Clientes (`/admin/clientes`)**: Demostrar actualización instantánea por WebSocket y exportación de reportes a PDF/Excel.

---

## 💡 Preguntas Rápidas y Respuestas Clave

- **¿Por qué usar FSM + IA en lugar de solo IA?**  
  *La FSM garantiza determinismo y exactitud legal en cálculos financieros y captura de datos (0% alucinaciones), mientras que la IA se utiliza de forma controlada en preguntas abiertas y soporte general.*
- **¿Qué pasa si se satura el servidor de mensajes?**  
  *El webhook responde HTTP 200 a Meta en menos de 2 milisegundos y encola el mensaje en BullMQ/Redis; un worker en hilo secundario procesa la carga a velocidad controlada.*
