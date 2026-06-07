# Fase Bonus 89 — Manual de Monitoreo y Mitigación de Incidentes en Caliente

## 1. Inspección de Consumo de Hardware en Tiempo Real

```bash
docker stats prochat_backend_container prochat_redis_container prochat_mariadb_container
```

**Esperado:** RAM Node.js estable entre 40MB–80MB incluso bajo estrés.

## 2. Rastreo de Logs con ID de Correlación

```bash
docker logs -f prochat_backend_container --tail 50 | grep -E "Queue Pipeline|FSM|Security"
```

## 3. Inspección Manual del Clúster de Redis

```bash
docker exec -it prochat_redis_container redis-cli -a redis_secure_master_token_2026
```

Dentro de la CLI:

```
KEYS fsm_session:*
TTL fsm_session:573150000000
```

**Esperado:** TTL devuelve entero decreciente < 86400s (24h), certificando auto-purga.
