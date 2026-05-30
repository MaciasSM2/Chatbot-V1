# Stage 1: Build Next.js application
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Set dynamic API URL argument during build
ARG NEXT_PUBLIC_API_URL=http://localhost:3000/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# Stage 2: Runtime image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./next.config.mjs

EXPOSE 3001
ENV PORT=3001

CMD ["npx", "next", "start", "-p", "3001"]
