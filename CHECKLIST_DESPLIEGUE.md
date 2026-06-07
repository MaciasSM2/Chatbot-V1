# Fase Bonus 86 — Lista de Verificación de Despliegue Perimetral

Ejecutar 30 minutos antes de la sustentación.

---

## Paso 1: Saneamiento del Entorno Local

```bash
docker compose down --volumes --remove-orphans
docker system prune -f --volumes
```

## Paso 2: Verificar `.env` en la raíz del monorepo

```
NODE_ENV=production
PORT=3000
DB_HOST=mariadb-server
DB_NAME=chatbot_crm_db
REDIS_HOST=redis-server
REDIS_PORT=6379
JWT_SECRET=master_jwt_secret_token_corporate_2026
META_VERIFY_TOKEN=colombia_logistica_handshake_token
```

## Paso 3: Lanzar orquestador

```bash
chmod +x orchestrate-production.sh
./orchestrate-production.sh
```

## Paso 4: Verificar health endpoint

```
http://localhost/api/health
```

Respuesta esperada:

```json
{
  "success": true,
  "status": "HEALTHY",
  "infrastructure": {
    "mariaDb": "OK",
    "redis": "OK",
    "metaApi": "OK"
  }
}
```
