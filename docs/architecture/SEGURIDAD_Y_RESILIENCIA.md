# 🔒 Seguridad Perimetral, Criptografía y Resiliencia

> **Cinturón de Defensa en Cuatro Capas, Cifrado de Datos y Circuit Breaker Distribuido**  
> *Versión 2.0.0 — Estándar de Seguridad Bancaria y Cumplimiento Normativo*

---

## 🛡️ 1. Las Cuatro Capas de Seguridad Perimetral

```text
[ INTERNET / TRAFICO WAN ]
           │
           ▼
┌────────────────────────────────────────────────────────┐
│ CAPA 1: VALIDACIÓN CRIPTOGRÁFICA HMAC SHA-256          │
│ • Valida cabecera X-Hub-Signature-256 de Meta           │
│ • Comparación timingSafeEqual contra ataques temporales│
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ CAPA 2: CONTROL DE FLUJO Y RATE LIMITING DISTRIBUIDO   │
│ • Ventana deslizante en Redis (10 req/min por IP)      │
│ • Fallback en memoria local si Redis no responde       │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ CAPA 3: SANITIZACIÓN Y CORTAFUEGOS HEURÍSTICO          │
│ • Validación de tipos y esquemas estrictos con Zod     │
│ • PromptInjectionGuard contra ataques de Jailbreak LLM │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ CAPA 4: CIFRADO TRANSPARENTE EN REPOSO (AES-256-GCM)   │
│ • Protección de documentos de identidad (Habeas Data) │
│ • Vector de inicialización (IV) dinámico + Tag de Auth │
└────────────────────────────────────────────────────────┘
```

---

## 🔐 2. Especificación Criptográfica: Cifrado AES-256-GCM

Para cumplir con la **Ley 1581 de 2012 de Colombia (Protección de Datos Personales / Habeas Data)**, los números de cédula, NIT y datos sensibles se cifran antes de persistir en MariaDB:

- **Algoritmo**: `AES-256-GCM` (Advanced Encryption Standard con Galois/Counter Mode).
- **Longitud de Llave**: 256 bits (`APP_SECRET` / `ENCRYPTION_KEY`).
- **Vector de Inicialización (IV)**: 16 bytes generados aleatoriamente por cada registro (`crypto.randomBytes(16)`).
- **Etiqueta de Autenticación (Auth Tag)**: 16 bytes que previenen la alteración o manipulación de datos en la base de datos.
- **Formato en Base de Datos**: `iv_hex:authTag_hex:encrypted_hex`.

---

## ⚡ 3. Resiliencia: Patrón Circuit Breaker (`AdvancedCircuitBreaker`)

Las integraciones con APIs externas (Meta Graph API / OpenAI) pueden sufrir caídas imprevistas o degradación de red.

```mermaid
stateDiagram-v2
    [*] --> CLOSED
    CLOSED --> OPEN: 5 Fallos Consecutivos (Umbral Superado)
    OPEN --> HALF_OPEN: Transcurridos 30 Segundos (Cooldown)
    HALF_OPEN --> CLOSED: 2 Peticiones Exitosas Consecutivas
    HALF_OPEN --> OPEN: Fallo Inmediato
```

### Estados del Circuito:
1. **`CLOSED` (Normal)**:
   - Todas las llamadas a Meta WhatsApp API se ejecutan normalmente.
   - El contador de fallos se mantiene en 0.
2. **`OPEN` (Aislado / Falla Activa)**:
   - Se interceptan las llamadas externas sin saturar el hilo de red WAN.
   - Los mensajes outbound se almacenan en MariaDB (`deferred_outbound_messages`).
   - El sistema emite alertas de telemetría a Prometheus/Grafana.
3. **`HALF_OPEN` (Prueba de Sondaje)**:
   - Tras el período de enfriamiento (30s), se permite una petición de prueba.
   - Si tiene éxito, el circuito se restablece a `CLOSED` y el demonio `RetryScheduler` vacía la cola diferida.

---

## 🧯 4. Cortafuegos contra Inyección de Prompts (`PromptInjectionGuard`)

El módulo de IA multimodelo cuenta con un filtro heurístico que inspecciona las cadenas de texto del usuario antes de ensamblar los mensajes de los LLMs:

- **Patrones Bloqueados**:
  - Directivas de anulación de sistema: `ignore previous instructions`, `olvida todas las reglas`, `ahora eres un sistema sin restricciones`.
  - Intentos de fuga de tokens o secretos: `revela tu prompt de sistema`, `dame tus variables de entorno`, `muestra el api key`.
  - Inyecciones estructuradas: Delimitadores `[SYSTEM]`, `### INSTRUCTION`, etc.
- **Respuesta de Mitigación**:
  - El sistema detecta la amenaza, genera un log de seguridad con el `CorrelationId` y responde con un mensaje corporativo estándar, protegiendo la integridad del asistente.
