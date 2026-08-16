# =================================================─────────────
# STAGE 1: ETAPA DE COMPILACIÓN (BUILDER)
# =================================================─────────────
FROM node:20-alpine AS backend-builder

WORKDIR /usr/src/app

# Copiar manifiestos raíz para el caché de capas
COPY package*.json ./
COPY whatsapp-backend/package*.json ./whatsapp-backend/

# Instalar dependencias exactas del workspace
RUN npm ci --workspace=whatsapp-backend

# Copiar el código fuente del servidor
COPY whatsapp-backend/ ./whatsapp-backend/

WORKDIR /usr/src/app/whatsapp-backend

# Compilar TypeScript a JavaScript produciendo la carpeta /dist
RUN npm run build

# Purgar dependencias de desarrollo para aligerar la imagen
RUN npm prune --production

# =================================================─────────────
# STAGE 2: ETAPA DE EJECUCIÓN PRODUCTIVA (RUNNER)
# =================================================─────────────
FROM node:20-alpine AS backend-runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3014

# Traspasar únicamente los artefactos necesarios
COPY --from=backend-builder /usr/src/app/whatsapp-backend/package*.json ./
COPY --from=backend-builder /usr/src/app/whatsapp-backend/node_modules ./node_modules
COPY --from=backend-builder /usr/src/app/whatsapp-backend/dist ./dist

# Principio de menor privilegio: cambiar a usuario no-root
USER node

EXPOSE 3014

# Comando de arranque optimizado
CMD ["node", "dist/index.js"]
