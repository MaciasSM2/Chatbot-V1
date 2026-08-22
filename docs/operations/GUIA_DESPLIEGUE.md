# 🚀 Guía de Despliegue en Producción (Docker Compose & Kubernetes)

> **Manual de Orquestación de Infraestructura Cloud-Native, Nginx Proxy y Helm Charts**  
> *Versión 2.0.0 — Entorno de Producción y Alta Disponibilidad*

---

## 📋 1. Requisitos Previos del Servidor

- **Sistema Operativo**: Linux Ubuntu 22.04 LTS / Debian 12 (Recomendado) o Windows Server.
- **Hardware Mínimo**: 2 vCPU, 4 GB de RAM, 20 GB de almacenamiento SSD.
- **Software**:
  - Docker Engine >= 24.0.0
  - Docker Compose v2 (plugin `docker compose`)
  - Node.js >= 20.x (para entornos de desarrollo local)
- **Dominio Público**: Con registros DNS tipo `A` apuntando a la IP pública del servidor.

---

## 🐳 2. Despliegue con Docker Compose (Paso a Paso)

### Paso 1: Clonar y configurar variables de entorno
```bash
# Clonar repositorio
git clone https://github.com/MaciasSM2/Chatbot-V1.git
cd Chatbot-V1

# Crear archivo de entorno de producción
cp .env.docker.example .env
```

Edite el archivo `.env` y configure sus credenciales seguras:

```ini
NODE_ENV=production
DB_USER=prochat_user
DB_PASSWORD=SuperSecurePasswordMariaDB2026!
DB_NAME=chatbot_crm_db
REDIS_PASSWORD=SuperSecureRedisToken2026!
JWT_SECRET=CorporateMasterJwtSecret2026#Token
MASTER_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
APP_SECRET=meta_whatsapp_app_secret_here
META_VERIFY_TOKEN=colombia_logistica_handshake_token
```

### Paso 2: Generar o montar certificados SSL (Let's Encrypt / Certbot)
```bash
# En el host de producción (Ubuntu/Debian)
sudo apt update && sudo apt install certbot -y
sudo certbot certonly --standalone -d tu-dominio.com

# Copiar o mapear certificados en ./nginx/certs
mkdir -p ./nginx/certs
sudo cp /etc/letsencrypt/live/tu-dominio.com/fullchain.pem ./nginx/certs/
sudo cp /etc/letsencrypt/live/tu-dominio.com/privkey.pem ./nginx/certs/
```

### Paso 3: Levantar todo el clúster de microservicios
```bash
# Construir imágenes y lanzar contenedores en background
docker compose up -d --build

# Verificar el estado de salud de todos los contenedores
docker compose ps
```

### Paso 4: Comprobación de Vitalidad (Smoke Tests)
```bash
# Verificar endpoint público de salud
curl -I http://localhost/health

# Salida esperada: HTTP/1.1 200 OK
```

---

## ☸️ 3. Despliegue en Kubernetes con Helm Charts

Para infraestructuras empresariales con clústeres de Kubernetes (EKS, GKE, AKS, K3s):

```bash
# Ubicarse en el directorio de Helm
cd helm/

# Instalar o actualizar el release en el namespace 'production'
helm upgrade --install prochat-platform ./prochat-chart \
  --namespace production \
  --create-namespace \
  --values ./prochat-chart/values.yaml
```

---

## 🛠️ 4. Scripts de Mantenimiento y Ciclo de Vida

| Acción | Comando |
|---|---|
| **Ver logs en tiempo real** | `docker compose logs -f whatsapp-backend` |
| **Reiniciar backend sin apagar base de datos** | `docker compose restart whatsapp-backend` |
| **Parar stack completo** | `docker compose down` |
| **Limpieza profunda de volúmenes y caché** | `docker compose down --volumes --remove-orphans` |
