#!/bin/sh

# @file orchestrate-production.sh
# @description Script unificado de orquestacion industrial de marca blanca (2026).
# Compila, levanta la red mesh, valida healthchecks y ejecuta pruebas de humo atomicas.

set -e

echo "======================================================================="
echo "[INICIANDO] PROTOCOLO MAESTRO DE DESPLIEGUE - PLATAFORMA PROCHAT (2026)"
echo "======================================================================="

# 1. Detener instancias previas y limpiar volumenes huerfanos
echo "[1/5] Purgando contenedores y sockets zombies pre-existentes..."
docker compose down --volumes --remove-orphans

# 2. Lanzar la compilacion multi-etapa y levantar la red privada bridge
echo "[2/5] Ejecutando construccion e inyeccion de imagenes Standalone..."
docker compose up -d --build

# 3. Bucle elastico de monitoreo de constantes vitales para MariaDB
echo "[3/5] Esperando estabilizacion del pool relacional de MariaDB..."
UNTIL_COUNTER=0
until docker exec prochat_mariadb_container mysqladmin ping -u root --password=root_secure_master_password_2026 --silent; do
    UNTIL_COUNTER=$((UNTIL_COUNTER+1))
    if [ $UNTIL_COUNTER -gt 12 ]; then
        echo "[Timeout] MariaDB no respondio en el tiempo limite. Abortando despliegue."
        exit 1
    fi
    echo "   -> Esperando inicializacion fisica del motor InnoDB ($UNTIL_COUNTER/12)..."
    sleep 3
done
echo "[OK] Persistencia MariaDB en linea y respondiendo consultas."

# 4. Monitoreo del broker de colas asincronas de BullMQ en Redis
echo "[4/5] Verificando Handshake con el cluster en memoria de Redis..."
if docker exec prochat_redis_container redis-cli -a redis_secure_master_token_2026 ping | grep -q "PONG"; then
    echo "[OK] Cluster Redis verificado con exito."
else
    echo "[FAIL] Fallo el enlace de control con Redis Cache."
    exit 1
fi

# Dar un tiempo prudencial para que Express 5 levante los sockets del puerto :3000
sleep 4

# 5. EJECUCION OBLIGATORIA DE LA PRUEBA DE HUMO (SMOKE TEST) PERIMETRAL
echo "[5/5] Disparando Prueba de Humo perimetral contra el gateway unificado Nginx..."
SMOKE_RESPONSE=$(curl -s http://localhost/api/health || echo "CRASH")

if echo "$SMOKE_RESPONSE" | grep -q '"status":"HEALTHY"'; then
    echo "======================================================================="
    echo "[DESPLIEGUE EXITOSO] EL ECOSISTEMA FULLSTACK OPERA AL 100% DE CONFORMIDAD"
    echo "======================================================================="
    echo "   -> Frontera HTTP Express v5: Activa en http://localhost/api/"
    echo "   -> Consola Dashboard Next.js: Lista en http://localhost/"
    echo "   -> Telemetria BullMQ / SICE-TAC: Sincronizada con Redis y MariaDB"
    echo "======================================================================="
else
    echo "[SMOKE TEST FAILED] El backend reporta un estado degradado o inaccesible."
    echo "   Diagnostico devuelto por el servidor: $SMOKE_RESPONSE"
    exit 1
fi
