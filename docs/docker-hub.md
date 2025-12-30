# Docker Hub Workflow

This guide covers Docker Hub deployment and publishing for Votive. For container architecture, environment variables, and security details, see [Architecture](architecture.md).

## Docker Hub Repositories

| Repository | Description |
|------------|-------------|
| `oxilith/votive-backend` | Express API proxy (multi-arch) |
| `oxilith/votive-frontend` | Nginx + React SPA (multi-arch) |
| `oxilith/votive-prompt-service` | Prompt management microservice (multi-arch) |
| `oxilith/votive-worker` | Background job scheduler (multi-arch) |
| `oxilith/votive-oci` | OCI compose artifact for single-command deployment |

All images support `linux/amd64` and `linux/arm64` platforms.

## Quick Start (Users)

### Prerequisites

- Docker Desktop 4.x or Docker Engine 24+
- Anthropic API key

### One-Command Deployment

```bash
# macOS/Linux
ANTHROPIC_API_KEY=<YOUR_KEY> \
DATABASE_KEY=<32+_CHAR_SECRET> \
ADMIN_API_KEY=<32+_CHAR_SECRET> \
SESSION_SECRET=<32+_CHAR_SECRET> \
JWT_ACCESS_SECRET=<32+_CHAR_SECRET> \
JWT_REFRESH_SECRET=<32+_CHAR_SECRET> \
  docker compose -f oci://oxilith/votive-oci:latest up

# Windows (PowerShell)
$env:ANTHROPIC_API_KEY="<YOUR_KEY>"
$env:DATABASE_KEY="<32+_CHAR_SECRET>"
$env:ADMIN_API_KEY="<32+_CHAR_SECRET>"
$env:SESSION_SECRET="<32+_CHAR_SECRET>"
$env:JWT_ACCESS_SECRET="<32+_CHAR_SECRET>"
$env:JWT_REFRESH_SECRET="<32+_CHAR_SECRET>"
docker compose -f oci://oxilith/votive-oci:latest up
```

This starts:
- **Frontend**: https://localhost (port 443)
- **Backend**: http://localhost:3001 (proxied through nginx)
- **Prompt Service**: http://localhost:3002 (internal)
- **Worker**: Background job scheduler (no exposed port)

### Required Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Your Claude API key |
| `DATABASE_KEY` | 32+ character encryption key for SQLite |
| `ADMIN_API_KEY` | 32+ character admin authentication key |
| `SESSION_SECRET` | 32+ character cookie signing secret (must differ from ADMIN_API_KEY) |
| `JWT_ACCESS_SECRET` | 32+ character secret for signing access tokens |
| `JWT_REFRESH_SECRET` | 32+ character secret for signing refresh tokens (must differ from JWT_ACCESS_SECRET) |

### Optional Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SMTP_HOST` | - | SMTP server hostname (for email verification/password reset) |
| `SMTP_PORT` | 587 | SMTP server port |
| `SMTP_SECURE` | false | Use SSL/TLS for SMTP |
| `SMTP_USER` | - | SMTP authentication username |
| `SMTP_PASSWORD` | - | SMTP authentication password |
| `SMTP_FROM` | - | Default sender email address |
| `JOB_TOKEN_CLEANUP_ENABLED` | true | Enable/disable token cleanup job |
| `JOB_TOKEN_CLEANUP_SCHEDULE` | `0 * * * *` | Cron schedule for token cleanup (hourly) |

Generate secure secrets with:
```bash
openssl rand -hex 32
```

For the complete environment variable reference, see [Production Deployment > Environment Variables](production-deployment.md#environment-variables).

## Local Build & Run

Build from source instead of using pre-built images:

```bash
# Clone and build
git clone https://github.com/Oxilith/votive.git
cd votive

# Build and run (requires all 6 environment variables)
ANTHROPIC_API_KEY=<KEY> \
DATABASE_KEY=<SECRET> \
ADMIN_API_KEY=<SECRET> \
SESSION_SECRET=<SECRET> \
JWT_ACCESS_SECRET=<SECRET> \
JWT_REFRESH_SECRET=<SECRET> \
  docker compose up --build
```

### Development vs Production

| Aspect | Local Build | OCI Deployment |
|--------|-------------|----------------|
| Images | Built from Dockerfiles | Pulled from Docker Hub |
| Rebuild | On each `--build` | Never (use cache clear) |
| Use case | Development, testing | Production, demos |

## HTTPS Configuration

### Self-Signed (Default)

By default, nginx generates self-signed certificates. Browsers will show a security warning - click "Advanced" > "Proceed" to continue.

### Trusted Certificates (Recommended)

For trusted HTTPS without browser warnings:

```bash
# Install mkcert (one-time setup)
brew install mkcert nss    # macOS
# or: choco install mkcert  # Windows

# Create local CA
mkcert -install

# Generate certificates
mkdir -p certs && cd certs
mkcert localhost 127.0.0.1 ::1
cd ..

# Run with trusted certs (auto-detected from ./certs)
ANTHROPIC_API_KEY=<KEY> \
DATABASE_KEY=<SECRET> \
ADMIN_API_KEY=<SECRET> \
SESSION_SECRET=<SECRET> \
JWT_ACCESS_SECRET=<SECRET> \
JWT_REFRESH_SECRET=<SECRET> \
  docker compose -f oci://oxilith/votive-oci:latest up
```

For security architecture details, see [Architecture > Security](architecture.md#security-architecture).

## Build & Publish (Maintainers)

### Prerequisites

- Docker Hub account with push access to `oxilith/*`
- Docker Buildx configured for multi-platform builds

### Build Multi-Arch Images

```bash
# Clean previous builds (optional but recommended)
docker rmi oxilith/votive-frontend:latest 2>/dev/null
docker rmi oxilith/votive-backend:latest 2>/dev/null
docker rmi oxilith/votive-prompt-service:latest 2>/dev/null
docker rmi oxilith/votive-worker:latest 2>/dev/null
docker buildx prune -f

# Build and push all images (linux/amd64 + linux/arm64)
docker buildx bake --push --no-cache
```

The `docker-bake.hcl` file defines build targets for all four services.

### Publish OCI Compose Artifact

After pushing images, publish the compose artifact:

```bash
# --resolve-image-digests ensures multi-arch support
# --with-env includes required env var definitions
docker compose publish --resolve-image-digests --with-env oxilith/votive-oci:latest
```

### Version Tagging

For releases, tag with version:

```bash
# Tag images
docker buildx bake --push --no-cache --set "*.tags=oxilith/votive-backend:v1.0.0"

# Publish versioned OCI artifact
docker compose publish --resolve-image-digests --with-env oxilith/votive-oci:v1.0.0
```

## Troubleshooting

### Platform Selection Issues

If Docker pulls the wrong architecture:

```bash
# Force specific platform
DOCKER_DEFAULT_PLATFORM=linux/amd64 \
ANTHROPIC_API_KEY=<KEY> \
DATABASE_KEY=<SECRET> \
ADMIN_API_KEY=<SECRET> \
SESSION_SECRET=<SECRET> \
JWT_ACCESS_SECRET=<SECRET> \
JWT_REFRESH_SECRET=<SECRET> \
  docker compose -f oci://oxilith/votive-oci:latest up
```

### OCI Cache Issues

If changes aren't reflected after image updates:

```bash
# Clear OCI cache
# macOS/Linux
rm -rf "$HOME/Library/Caches/docker-compose/"

# Windows (PowerShell)
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\docker-compose"

# Then re-run
docker compose -f oci://oxilith/votive-oci:latest up
```

### Container Health Checks

Check container health status:

```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

All containers use Node.js fetch for health checks (Alpine images don't have wget/curl):

```bash
# Manual health check
docker exec votive-backend node -e "fetch('http://localhost:3001/health').then(r => console.log(r.ok))"
```

### Service Startup Order

Containers start in order with health check dependencies:
1. `prompt-service` starts first
2. `worker` waits for prompt-service to be healthy (shares database)
3. `backend` waits for prompt-service to be healthy
4. `frontend` waits for backend to be healthy

If startup fails, check logs:

```bash
docker compose logs prompt-service
docker compose logs worker
docker compose logs backend
docker compose logs frontend
```

### Common Issues

| Issue | Solution |
|-------|----------|
| Port 443 in use | Stop other services or change port: `ports: ["8443:443"]` |
| Permission denied | Run Docker Desktop as admin, or add user to docker group |
| Image not found | Clear OCI cache and retry |
| Health check failing | Verify env vars are set, check container logs |
| Worker not running | Check `JOB_TOKEN_CLEANUP_ENABLED` env var, review worker logs |

## Related Documentation

- [Architecture](architecture.md) - Container architecture, environment variables, security
- [Motivation](Motivation.md) - Theoretical framework and psychology principles
