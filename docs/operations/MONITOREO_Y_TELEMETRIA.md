# 📊 Monitoreo, Telemetría y Observabilidad en Tiempo Real

> **Instrumentación con Prometheus, Dashboards de Grafana y Trazabilidad con Correlation IDs**  
> *Versión 2.0.0 — Estándar de Observabilidad Enterprise*

---

## 📈 1. Arquitectura de Observabilidad

El sistema incorpora métricas en tiempo real, recolección de logs estructurados y paneles de visualización:

```text
+─────────────────────────────────+
| BACKEND NODE.JS EXPRESS 5       |
| • prom-client (/metrics)        | ──(Scrape cada 15s)──► [ PROMETHEUS ]
| • Winston Logger (JSON + UUID)  |                           │
+─────────────────────────────────+                           ▼
                                                      [ GRAFANA 10 ]
                                                  Dashboards Operativos:
                                                  - Tasa de Mensajes / seg
                                                  - Latencia SICE-TAC (p95)
                                                  - Estado Colas BullMQ
                                                  - Salud Circuit Breaker
```

---

## 🔍 2. Rastreo de Transacciones con Correlation ID

Cada solicitud HTTP o evento de webhook recibe un identificador único global `X-Correlation-ID` (UUID v4):

```json
{
  "timestamp": "2026-08-22T14:00:00.123Z",
  "level": "info",
  "correlationId": "f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
  "context": "FSM_ORCHESTRATOR",
  "message": "Transición de estado ejecutada: WELCOME -> AWAITING_NAME_CAPTURE",
  "phoneHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}
```

### Comando para rastrear un mensaje específico en Docker:
```bash
docker logs prochat_backend 2>&1 | grep "f81d4fae-7dec-11d0-a765-00a0c91e6bf6"
```

---

## 📊 3. Métricas Clave Expuestas en `/metrics` (Prometheus)

| Métrica Prometheus | Tipo | Descripción |
|---|---|---|
| `prochat_http_request_duration_seconds` | Histogram | Latencia de peticiones HTTP por ruta y código de respuesta |
| `prochat_bullmq_active_jobs` | Gauge | Cantidad de trabajos en procesamiento activo por el worker |
| `prochat_bullmq_waiting_jobs` | Gauge | Mensajes encolados pendientes de atención en Redis |
| `prochat_fsm_transitions_total` | Counter | Total de transiciones de estado por tipo de estado |
| `prochat_circuit_breaker_state` | Gauge | Estado actual del Circuit Breaker (0: CLOSED, 1: OPEN, 2: HALF_OPEN) |
| `prochat_sicetac_calculation_duration_ms` | Histogram | Tiempo de resolución del motor de liquidación SICE-TAC |

---

## 🖥️ 4. Inspección de Consumo de Hardware en Vivo

```bash
# Monitor de CPU y Memoria de los contenedores
docker stats prochat_backend prochat_redis prochat_mariadb prochat_dashboard

# Rango de Consumo Normal:
# - prochat_backend: 40 MB – 90 MB RAM
# - prochat_redis: 15 MB – 35 MB RAM
# - prochat_mariadb: 120 MB – 250 MB RAM
```
