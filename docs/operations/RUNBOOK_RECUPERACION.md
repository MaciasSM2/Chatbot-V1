# 🛠️ Runbook de Operaciones y Recuperación ante Incidentes en Caliente

> **Protocolos de Respuesta Rápida ante Contingencias en Producción**  
> *Versión 2.0.0 — Procedimientos de Mitigación y Restauración de Servicio*

---

## 🚨 Escenario 1: Saturación de Conexiones en MariaDB

### Síntomas:
- El backend registra errores: `Error: Too many connections`.
- El endpoint `/health` reporta `"mariaDb": "DEGRADED"`.

### Procedimiento de Mitigación:
1. Incrementar el límite de conexiones concurrentes en caliente sin apagar la base de datos:
   ```bash
   docker exec -it prochat_mariadb mysql -u root -p"$DB_PASSWORD" -e "SET GLOBAL max_connections = 300;"
   ```
2. Verificar las conexiones activas actuales:
   ```bash
   docker exec -it prochat_mariadb mysql -u root -p"$DB_PASSWORD" -e "SHOW STATUS LIKE 'Threads_connected';"
   ```

---

## 🚨 Escenario 2: Trabajos Estancados en BullMQ (Stalled Jobs en Redis)

### Síntomas:
- Los mensajes entrantes se acumulan en la cola pero el bot no emite respuestas.
- El worker arroja warnings de `stalled job detected`.

### Procedimiento de Mitigación:
1. Inspeccionar el estado de las colas en Redis:
   ```bash
   docker exec -it prochat_redis redis-cli -a "$REDIS_PASSWORD"
   # En la consola de Redis:
   LLEN bull:incoming_messages:wait
   SCARD bull:incoming_messages:active
   ```
2. Ejecutar purga de trabajos fallidos a través de la API administrativa:
   ```bash
   curl -X POST http://localhost/api/admin/queues/purge-failed \
     -H "Authorization: Bearer $JWT_ADMIN_TOKEN" \
     -H "X-Correlation-ID: EMERGENCY-PURGE-2026"
   ```
3. Reiniciar controladamente el worker del backend:
   ```bash
   docker compose restart whatsapp-backend
   ```

---

## 🚨 Escenario 3: Caída Global de Meta WhatsApp API (Circuit Breaker OPEN)

### Síntomas:
- El Circuit Breaker transiciona a `OPEN`.
- Los clientes envían mensajes pero Meta no recibe los despachos salientes.

### Procedimiento de Mitigación:
1. El sistema opera de forma **autónoma**: no requiere intervención de pánico.
2. Los mensajes salientes quedan retenidos en la tabla `deferred_outbound_messages`.
3. Una vez Meta restablece el servicio, el demonio `RetryScheduler` vacía automáticamente los mensajes diferidos con backoff exponencial.
4. Para forzar un reintento manual:
   ```bash
   curl -X POST http://localhost/api/admin/scheduler/force-sync \
     -H "Authorization: Bearer $JWT_ADMIN_TOKEN"
   ```

---

## 🚨 Escenario 4: Desconexión de Sockets en el Dashboard Administrativo

### Síntomas:
- Los operadores no ven las alertas entrantes en tiempo real sin recargar la página.

### Procedimiento de Mitigación:
1. Validar la configuración del upstream de WebSockets en Nginx:
   ```bash
   docker exec -it prochat_nginx nginx -T | grep -E "Upgrade|Connection"
   ```
2. Verificar que los puertos `3014` y `3015` mantengan el bridge activo:
   ```bash
   docker network inspect prochat_mesh
   ```
