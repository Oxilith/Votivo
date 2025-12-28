# Production Deployment Guide

This guide covers security considerations and configuration requirements for deploying Votive in production environments.

## Environment Variables

### Backend Service

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | Yes | - | Anthropic API key for Claude |
| `NODE_ENV` | Yes | development | Set to `production` |
| `PORT` | No | 3001 | Server port |
| `HTTPS_ENABLED` | No | true | Enable HTTPS |
| `HTTPS_KEY_PATH` | No | ../certs/localhost+2-key.pem | Path to SSL key file |
| `HTTPS_CERT_PATH` | No | ../certs/localhost+2.pem | Path to SSL certificate file |
| `CORS_ORIGIN` | Yes | - | Allowed frontend origin |
| `RATE_LIMIT_WINDOW_MS` | No | 60000 | Rate limit window (ms) |
| `RATE_LIMIT_MAX_REQUESTS` | No | 10 | Max requests per window |
| `CLAUDE_RATE_LIMIT_WINDOW_MS` | No | 60000 | Claude API rate limit window (ms) |
| `CLAUDE_RATE_LIMIT_MAX_REQUESTS` | No | 5 | Claude API max requests per window |
| `LOG_LEVEL` | No | info | Pino log level (fatal, error, warn, info, debug, trace) |
| `THINKING_ENABLED` | No | true | Enable Claude extended thinking |
| `PROMPT_SERVICE_URL` | Yes | - | Prompt service internal URL |
| `CIRCUIT_BREAKER_TIMEOUT` | No | 10000 | Circuit breaker timeout (ms) |
| `CIRCUIT_BREAKER_RESET_TIMEOUT` | No | 30000 | Circuit breaker reset (ms) |
| `CIRCUIT_BREAKER_ERROR_THRESHOLD` | No | 50 | Error threshold percentage to open circuit |

### Prompt Service

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | development | Set to `production` |
| `PORT` | No | 3002 | Server port |
| `DATABASE_URL` | Yes | - | SQLite database path |
| `DATABASE_KEY` | Yes | - | 32+ char encryption key for SQLCipher |
| `ADMIN_API_KEY` | Yes | - | 32+ char admin authentication key |
| `SESSION_SECRET` | Yes | - | 32+ char cookie signing secret |
| `CORS_ORIGINS` | Yes | - | Comma-separated allowed origins |
| `LOG_LEVEL` | No | info | Pino log level (fatal, error, warn, info, debug, trace) |

**Important:** `SESSION_SECRET` must differ from `ADMIN_API_KEY` in production for security. In development, at least one of `SESSION_SECRET` or `ADMIN_API_KEY` must be set—the service will fail to start with a clear error message if neither is configured. When only `ADMIN_API_KEY` is set, it's used as the session secret and a warning is logged.

## Docker Compose Configuration

The `docker-compose.yml` expects the following environment variables to be set:

```bash
# Required for backend
export ANTHROPIC_API_KEY="sk-ant-..."

# Required for prompt-service
export DATABASE_KEY="$(openssl rand -hex 32)"
export ADMIN_API_KEY="$(openssl rand -hex 32)"
export SESSION_SECRET="$(openssl rand -hex 32)"
```

### Docker Secrets (Recommended for Production)

For production deployments, use Docker secrets instead of environment variables:

```yaml
# docker-compose.secrets.yml
version: '3.8'

services:
  prompt-service:
    secrets:
      - database_key
      - admin_api_key
      - session_secret
    environment:
      - DATABASE_KEY_FILE=/run/secrets/database_key
      - ADMIN_API_KEY_FILE=/run/secrets/admin_api_key
      - SESSION_SECRET_FILE=/run/secrets/session_secret

  backend:
    secrets:
      - anthropic_api_key
    environment:
      - ANTHROPIC_API_KEY_FILE=/run/secrets/anthropic_api_key

secrets:
  database_key:
    external: true
  admin_api_key:
    external: true
  session_secret:
    external: true
  anthropic_api_key:
    external: true
```

Create secrets:
```bash
echo "your-database-key" | docker secret create database_key -
echo "your-admin-key" | docker secret create admin_api_key -
echo "your-session-secret" | docker secret create session_secret -
echo "sk-ant-..." | docker secret create anthropic_api_key -
```

## Rate Limiting

### Single Instance

The default in-memory rate limiting works correctly for single-instance deployments.

### Multi-Instance Deployments

For deployments behind a load balancer with multiple instances, see [GitHub Issue #16](https://github.com/Oxilith/Votive/issues/16) for Redis-backed rate limiting setup.

## Security Considerations

### Input Validation

- Prompt content is limited to 50,000 characters (50KB)
- Content is validated for XSS patterns (script tags, event handlers, etc.)
- Keys must be UPPER_SNAKE_CASE format

### Authentication

- Admin UI uses HttpOnly cookies with:
  - `secure: true` (HTTPS only in production)
  - `sameSite: 'strict'` (CSRF protection)
  - `signed: true` (tamper detection)
- API key fallback uses timing-safe comparison

### Database Encryption

- SQLite database is encrypted using SQLCipher via libsql
- Encryption key must be at least 32 characters
- Key is never logged or exposed in error messages

## Circuit Breaker Configuration

The backend uses circuit breakers for prompt-service communication:

| Setting | Default | Description |
|---------|---------|-------------|
| Timeout | 10s | Per-request timeout |
| Error Threshold | 50% | Errors before circuit opens |
| Reset Timeout | 30s | Time before retry attempt |
| Volume Threshold | 5 | Minimum requests before calculating threshold |

When the circuit opens:
- Requests fail fast with 503
- Stale cached data is returned if available
- Background refresh is scheduled

## Health Checks

| Endpoint | Service | Description |
|----------|---------|-------------|
| `/health` | Backend | Overall health + dependencies |
| `/health` | Prompt Service | Service health |
| `/health/live` | Backend | Liveness probe |
| `/health/ready` | Backend | Readiness probe |

## Logging

Both services use Pino for structured JSON logging:

```bash
LOG_LEVEL=info  # Options: fatal, error, warn, info, debug, trace
```

## Monitoring

Consider adding:
- Prometheus metrics endpoint (see [Issue #12](https://github.com/Oxilith/Votive/issues/12))
- Grafana dashboards (see [Issue #14](https://github.com/Oxilith/Votive/issues/14))
- Distributed tracing (see [Issue #11](https://github.com/Oxilith/Votive/issues/11))
