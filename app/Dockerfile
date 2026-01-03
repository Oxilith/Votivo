# Frontend Dockerfile
FROM node:24-alpine AS builder

RUN npm install -g @dotenvx/dotenvx

WORKDIR /app

# Copy workspace config
COPY package.json package-lock.json ./
COPY tsconfig.base.json ./
COPY shared/package.json shared/
COPY app/package.json app/

# Install all dependencies
RUN npm ci --workspaces --include-workspace-root

# Build shared
COPY shared/src shared/src
COPY shared/tsconfig.json shared/
COPY shared/tsup.config.ts shared/
RUN npm run build -w shared

# Build app
COPY app/src app/src
COPY app/public app/public
COPY app/index.html app/
COPY app/tsconfig.json app/
COPY app/tsconfig.app.json app/
COPY app/tsconfig.node.json app/
COPY app/tsconfig.test.json app/
COPY app/vite.config.ts app/
COPY app/postcss.config.* app/

RUN npm run build -w app

# Production
FROM nginx:1.28.1-alpine

RUN apk add --no-cache openssl nodejs npm && \
    mkdir -p /etc/nginx/ssl

COPY app/nginx.conf /etc/nginx/conf.d/default.conf
COPY app/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

COPY --from=builder /app/app/dist /usr/share/nginx/html

EXPOSE 80 443

ENTRYPOINT ["/docker-entrypoint.sh"]

CMD ["nginx", "-g", "daemon off;"]
