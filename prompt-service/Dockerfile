# Prompt Service Dockerfile
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

# Copy workspace config
COPY package.json package-lock.json ./
COPY tsconfig.base.json ./
COPY shared/package.json shared/
COPY prompt-service/package.json prompt-service/

# Install all dependencies
RUN npm ci --workspaces --include-workspace-root

# Build shared
COPY shared/src shared/src
COPY shared/tsconfig.json shared/
COPY shared/tsup.config.ts shared/
RUN npm run build -w shared

# Build prompt-service
COPY prompt-service/src prompt-service/src
COPY prompt-service/prisma prompt-service/prisma
COPY prompt-service/scripts prompt-service/scripts
COPY prompt-service/tsconfig.json prompt-service/
COPY prompt-service/tsup.config.ts prompt-service/
COPY prompt-service/vite.config.ts prompt-service/
RUN npm run db:generate -w prompt-service
RUN npm run build -w prompt-service

# Production
FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY prompt-service/package.json prompt-service/

RUN npm ci --workspaces --include-workspace-root --omit=dev

COPY --from=builder /app/shared/dist shared/dist
COPY --from=builder /app/prompt-service/dist prompt-service/dist
COPY --from=builder /app/prompt-service/prisma prompt-service/prisma
COPY --from=builder /app/node_modules/.prisma node_modules/.prisma

RUN mkdir -p /app/data

WORKDIR /app/prompt-service
ENV DATABASE_URL=file:/app/data/prompts.db

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3002/health').then(r=>r.ok||process.exit(1)).catch(()=>process.exit(1))"

CMD ["sh", "-c", "if [ -n \"$DATABASE_KEY\" ]; then node dist/scripts/migrate.js; else npx prisma migrate deploy; fi && node dist/prisma/seed.js && node dist/src/index.js"]
