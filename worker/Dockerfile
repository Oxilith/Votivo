# Worker Dockerfile
FROM node:22-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

# Copy workspace config
COPY package.json package-lock.json ./
COPY tsconfig.base.json ./
COPY shared/package.json shared/
COPY worker/package.json worker/

# Install all dependencies
RUN npm ci --workspaces --include-workspace-root

# Build shared
COPY shared/src shared/src
COPY shared/tsconfig.json shared/
COPY shared/tsup.config.ts shared/
RUN npm run build -w shared

# Build worker
COPY worker/src worker/src
COPY worker/prisma worker/prisma
COPY worker/tsconfig.json worker/
COPY worker/tsup.config.ts worker/
RUN npm run db:generate -w worker
RUN npm run build -w worker

# Production
FROM node:22-alpine

RUN apk add --no-cache openssl

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY worker/package.json worker/

RUN npm ci --workspaces --include-workspace-root --omit=dev

COPY --from=builder /app/shared/dist shared/dist
COPY --from=builder /app/worker/dist worker/dist
COPY --from=builder /app/worker/prisma worker/prisma
COPY --from=builder /app/node_modules/.prisma node_modules/.prisma

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser && \
    chown -R appuser:nodejs /app

USER appuser
WORKDIR /app/worker

CMD ["node", "dist/index.js"]
