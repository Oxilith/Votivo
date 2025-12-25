# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build:server
RUN npm run build:admin

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

# Create data directory for SQLite
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV DATABASE_URL=file:/app/data/prompts.db

EXPOSE 3002

# Health check configuration:
# - Uses Node.js fetch since wget/curl are not available in Alpine by default
# - Explicitly checks response.ok (HTTP 200-299) for success
# - interval: Check every 30s after container is running
# - timeout: Fail if health check takes longer than 10s
# - start-period: Allow 10s for service to initialize before counting failures
# - retries: Mark unhealthy after 3 consecutive failures
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3002/health').then(r => { if (!r.ok) throw new Error('Health check failed: ' + r.status); }).catch(e => { console.error(e.message); process.exit(1); })"

# Run migrations and start server
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
