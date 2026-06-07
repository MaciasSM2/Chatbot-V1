# Fase Bonus 91 — Guia de Mitigacion de Errores y Recuperacion ante Desastres

---

## Escenario A: Exceso de Conexiones Activas en MariaDB

**Sintoma:** Backend registra excepciones `500`, Dashboard muestra `MariaDB: DOWN` por saturacion de hilos.

**Mitigacion:** Incrementar limite de hilos sin apagar el contenedor:

```bash
docker exec -it prochat_mariadb_container mysql -u root -p'root_secure_master_password_2026' -e "SET GLOBAL max_connections = 250;"
```

**Verificacion:**
```bash
docker exec -it prochat_mariadb_container mysql -u root -p'root_secure_master_password_2026' -e "SHOW STATUS LIKE 'Threads_connected';"
```

---

## Escenario B: Bloqueo de Trabajos Estancados en BullMQ (Stalled Jobs)

**Sintoma:** Webhook recibe mensajes pero el bot no responde; cola Redis retiene tareas activas.

**Mitigacion:** Purga de tareas huerfanas via endpoint blindado:

```bash
curl -X POST http://localhost/api/admin/queues/purge-failed \
  -H "Authorization: Bearer INYECTAR_AQUI_TU_TOKEN_JWT_HTTP_ONLY" \
  -H "X-Correlation-ID: EMERGENCY-PURGE-2026"
```

**Reinicio controlado:**
```bash
docker compose restart whatsapp-backend
```

---

## Escenario C: Desconexion de Sockets por Latencia de Red

**Sintoma:** Chats CRM no actualizan en tiempo real; cronometro de continuidad se congela.

**Mitigacion:** Validar estado de puertos perimetrales del proxy Nginx:

```bash
docker exec -it prochat_nginx_gateway nginx -T | grep -E "upstream|proxy_pass"
```
