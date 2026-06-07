# ──────────────────────────────────────────────────────────────
# STAGE 1: COMPILADOR DE COMPONENTES NEXT.JS (BUILDER)
# ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS dashboard-compiler

WORKDIR /usr/src/app

COPY package*.json ./
COPY whatsapp-dashboard/package*.json ./whatsapp-dashboard/

RUN npm ci --workspace=whatsapp-dashboard

COPY whatsapp-dashboard/ ./whatsapp-dashboard/

WORKDIR /usr/src/app/whatsapp-dashboard

# Inyectar bandera mandatoria para compilar bajo el esquema optimizado standalone de Next.js
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

# Traspasar los artefactos standalone optimizados generados en el builder
COPY --from=dashboard-compiler /usr/src/app/whatsapp-dashboard/.next/standalone ./
COPY --from=dashboard-compiler /usr/src/app/whatsapp-dashboard/.next/static ./.next/static
COPY --from=dashboard-compiler /usr/src/app/whatsapp-dashboard/public ./public

USER node

EXPOSE 3001

# Arrancar Next.js utilizando el mini-servidor optimizado de producción compilado por el framework
CMD ["node", "server.js"]
