# =================================================─────────────
# STAGE 1: ETAPA DE COMPILACIÓN (BUILDER)
# =================================================─────────────
FROM node:20-alpine AS dashboard-builder

WORKDIR /usr/src/app

COPY package*.json ./
COPY whatsapp-dashboard/package*.json ./whatsapp-dashboard/

RUN npm ci --workspace=whatsapp-dashboard

COPY whatsapp-dashboard/ ./whatsapp-dashboard/

WORKDIR /usr/src/app/whatsapp-dashboard

ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PRIVATE_STANDALONE=true

# Compilar Next.js en modo standalone
RUN npm run build

# =================================================─────────────
# STAGE 2: ETAPA DE EJECUCIÓN ENDURECIDA (RUNNER)
# =================================================─────────────
FROM node:20-alpine AS dashboard-runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3015
ENV NEXT_TELEMETRY_DISABLED=1

# Copiar el directorio compilado standalone que mantiene la jerarquía del monorepo
COPY --from=dashboard-builder /usr/src/app/whatsapp-dashboard/.next/standalone ./
 
# Traspasar archivos estáticos e imágenes a sus ubicaciones de trabajo correspondientes
COPY --from=dashboard-builder /usr/src/app/whatsapp-dashboard/.next/static ./whatsapp-dashboard/.next/static
COPY --from=dashboard-builder /usr/src/app/whatsapp-dashboard/public ./whatsapp-dashboard/public

USER node

EXPOSE 3015

# Ejecutar directamente el servidor compilado de Next.js
CMD ["node", "whatsapp-dashboard/server.js"]
