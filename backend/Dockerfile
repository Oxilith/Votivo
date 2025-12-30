# Backend Dockerfile
FROM node:22-alpine AS builder

WORKDIR /app

# Copy workspace config
COPY package.json package-lock.json ./
COPY tsconfig.base.json ./
COPY shared/package.json shared/
COPY backend/package.json backend/

# Install all dependencies
RUN npm ci --workspaces --include-workspace-root

# Build shared
COPY shared/src shared/src
COPY shared/tsconfig.json shared/
COPY shared/tsup.config.ts shared/
RUN npm run build -w shared

# Build backend
COPY backend/src backend/src
COPY backend/tsconfig.json backend/
COPY backend/tsup.config.ts backend/
RUN npm run build -w backend

# Production
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache wget

COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY backend/package.json backend/

RUN npm ci --workspaces --include-workspace-root --omit=dev

COPY --from=builder /app/shared/dist shared/dist
COPY --from=builder /app/backend/dist backend/dist

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser && \
    chown -R appuser:nodejs /app

USER appuser
WORKDIR /app/backend

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost:3001/health || exit 1

CMD ["node", "dist/index.js"]
