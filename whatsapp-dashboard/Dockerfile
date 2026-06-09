# ──────────────────────────────────────────────────────────────
# STAGE 1: COMPILADOR Y CONSTRUCTOR DE ARTEFACTOS (BUILDER)
# ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS dashboard-compiler

WORKDIR /usr/src/app

# Copiar selectivamente los descriptores de dependencias para el caché de capas
COPY package*.json ./
COPY whatsapp-dashboard/package*.json ./whatsapp-dashboard/

# Instalar los módulos del espacio de trabajo aislado
RUN npm ci --workspace=whatsapp-dashboard

# Traspasar el código fuente del frontend
COPY whatsapp-dashboard/ ./whatsapp-dashboard/

WORKDIR /usr/src/app/whatsapp-dashboard

# Desactivar la telemetría de Next.js e inyectar bandera standalone
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PRIVATE_STANDALONE=true

RUN npm run build

# ──────────────────────────────────────────────────────────────
# STAGE 2: ENTORNO DE EJECUCIÓN MINIMALISTA DE PRODUCCIÓN (RUNNER)
# ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS dashboard-production-runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV NEXT_TELEMETRY_DISABLED=1

# Traspasar las dependencias del sub-entorno compilado
COPY --from=dashboard-compiler /usr/src/app/whatsapp-dashboard/.next/standalone ./

# 🔄 CORRECCIÓN CRÍTICA DE MAPEO EN MONOREPOS
# Next.js standalone replica la estructura del workspace dentro de .next/standalone/
# El servidor espera .next/static y public/ bajo el subdirectorio del workspace.
COPY --from=dashboard-compiler /usr/src/app/whatsapp-dashboard/.next/static ./whatsapp-dashboard/.next/static
COPY --from=dashboard-compiler /usr/src/app/whatsapp-dashboard/public ./whatsapp-dashboard/public

# 🔥 CORRECCIÓN DE process.cwd(): Conmutar al subdirectorio del workspace
# Sin esto, Next.js busca páginas en /app/.next/server/ en vez de
# /app/whatsapp-dashboard/.next/server/ → 404 en TODAS las rutas
WORKDIR /app/whatsapp-dashboard

# CORTAFUEGOS DE PRIVILEGIOS: Conmutar al usuario seguro sin permisos root
USER node

EXPOSE 3001

# Arrancar el servidor Next.js standalone desde su propia raíz
CMD ["node", "server.js"]
