# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copy shared package first
COPY shared/package.json ./shared/
COPY shared/src ./shared/src
COPY shared/tsconfig.json ./shared/

# Copy backend package files
COPY backend/package*.json ./backend/

# Install backend dependencies
WORKDIR /app/backend
RUN npm ci

# Copy backend source code
COPY backend/src ./src
COPY backend/tsconfig.json ./

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:22-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Update npm to fix CVE-2025-64756 (glob vulnerability) and install wget for health checks
RUN npm install -g npm@latest && \
    apk add --no-cache wget

# Copy built files and production dependencies
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/package.json ./

# Make shared package resolvable at runtime (compiled code is in dist/shared/src/)
# Remove the broken symlink created by npm during install, then create the real package
RUN rm -rf node_modules/shared && \
    mkdir -p node_modules/shared && \
    echo '{"name":"shared","type":"module","exports":{"./*":"./src/*"}}' > node_modules/shared/package.json && \
    cp -r dist/shared/src node_modules/shared/

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 expressjs && \
    chown -R expressjs:nodejs /app

USER expressjs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start server
CMD ["node", "dist/backend/src/index.js"]
