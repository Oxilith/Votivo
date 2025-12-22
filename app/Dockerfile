# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copy shared package first
COPY shared/package.json ./shared/
COPY shared/src ./shared/src
COPY shared/tsconfig.json ./shared/

# Copy frontend package files
COPY app/package*.json ./app/

# Install frontend dependencies
WORKDIR /app/app
RUN npm ci

# Copy frontend source code and configs
COPY app/src ./src
COPY app/public ./public
COPY app/index.html ./
COPY app/tsconfig.json ./
COPY app/tsconfig.app.json ./
COPY app/tsconfig.node.json ./
COPY app/vite.config.ts ./
COPY app/postcss.config.js ./

# Build application
RUN npm run build

# Stage 2: Production with Nginx
FROM nginx:alpine AS runner

# Copy built files to nginx
COPY --from=builder /app/app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY app/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
