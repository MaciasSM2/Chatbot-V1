# ──────────────────────────────────────────────────────────────
# STAGE 1: COMPILADOR Y CONSTRUCTOR DE DEPENDENCIAS (BUILDER)
# ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS backend-compiler

WORKDIR /usr/src/app

# Copiar manifiestos raíces de workspaces de NPM para aprovechar el caché de capas de Docker
COPY package*.json ./
COPY whatsapp-backend/package*.json ./whatsapp-backend/

# Instalar la totalidad de dependencias incluyendo devDependencies para transpilar TS
RUN npm ci --workspace=whatsapp-backend

# Traspasar el código fuente relacional del backend
COPY whatsapp-backend/ ./whatsapp-backend/

# Ejecutar la transpilación estricta de TypeScript a código nativo ES2022 en la carpeta dist/
WORKDIR /usr/src/app/whatsapp-backend
RUN npm run build

# Purgar devDependencies instaladas para dejar únicamente los nodos requeridos en runtime
RUN npm prune --production

# ──────────────────────────────────────────────────────────────
# STAGE 2: ENTORNO DE EJECUCIÓN ENDURECIDO DE PRODUCCIÓN (RUNNER)
# ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS backend-production-runner

WORKDIR /app

# Inyectar bandera nativa de entorno para optimizaciones internas de V8 / Express 5
ENV NODE_ENV=production
ENV PORT=3000

# Traspasar únicamente el árbol limpio de dependencias y el dist transpilado
COPY --from=backend-compiler /usr/src/app/whatsapp-backend/node_modules ./node_modules
COPY --from=backend-compiler /usr/src/app/whatsapp-backend/dist ./dist
COPY --from=backend-compiler /usr/src/app/whatsapp-backend/package.json ./package.json

# CORTAFUEGOS DE PRIVILEGIOS: Dropear root y conmutar al usuario sin privilegios por defecto de Alpine
USER node

EXPOSE 3000

# Disparar la ejecución directamente
CMD ["node", "dist/index.js"]
