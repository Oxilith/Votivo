# Production Deployment Guide

This guide covers security considerations and configuration requirements for deploying Votive in production environments.

## Environment Variables

### Backend Service

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | Yes | - | Anthropic API key for Claude |
| `NODE_ENV` | Yes | development | Set to `production` |
| `BACKEND_PORT` | No | 3001 | Server port |
| `BACKEND_HTTPS_ENABLED` | No | true | Enable HTTPS |
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
| `PROMPT_SERVICE_PORT` | No | 3002 | Server port |
| `DATABASE_URL` | Yes | - | SQLite database path |
| `DATABASE_KEY` | Yes | - | 32+ char encryption key for SQLCipher |
| `ADMIN_API_KEY` | Yes | - | 32+ char admin authentication key |
| `SESSION_SECRET` | Yes | - | 32+ char cookie signing secret |
| `CORS_ORIGINS` | Yes | - | Comma-separated allowed origins |
| `LOG_LEVEL` | No | info | Pino log level (fatal, error, warn, info, debug, trace) |
| `JWT_ACCESS_SECRET` | Yes | - | 32+ char secret for JWT access tokens |
| `JWT_REFRESH_SECRET` | Yes | - | 32+ char secret for JWT refresh tokens |
| `JWT_ACCESS_EXPIRY` | No | 15m | Access token expiry (e.g., 15m, 1h) |
| `JWT_REFRESH_EXPIRY` | No | 7d | Refresh token expiry (e.g., 7d, 30d) |
| `BCRYPT_SALT_ROUNDS` | No | 10 | Bcrypt password hashing rounds |
| `APP_URL` | Yes | - | Frontend application URL for email links |
| `API_URL` | Yes | - | API URL for email links |
| `SMTP_HOST` | No | - | SMTP server host for sending emails |
| `SMTP_PORT` | No | 587 | SMTP server port |
| `SMTP_USER` | No | - | SMTP authentication username |
| `SMTP_PASS` | No | - | SMTP authentication password |
| `SMTP_FROM` | No | - | Email sender address |
| `RATE_LIMIT_WINDOW_MS` | No | 60000 | Rate limit window (ms) |
| `RATE_LIMIT_LOGIN` | No | 5 | Login attempts per window |
| `RATE_LIMIT_REGISTER` | No | 5 | Registration attempts per window |
| `RATE_LIMIT_PASSWORD_RESET` | No | 3 | Password reset requests per window |
| `RATE_LIMIT_FORGOT_PASSWORD` | No | 3 | Password reset confirms per window |
| `RATE_LIMIT_TOKEN_REFRESH` | No | 20 | Token refresh requests per window |
| `RATE_LIMIT_USER_DATA` | No | 30 | Assessment/analysis requests per window |
| `RATE_LIMIT_PROFILE` | No | 15 | Profile operations per window |
| `RATE_LIMIT_ADMIN_API` | No | 100 | Admin API requests per window |
| `RATE_LIMIT_ADMIN_WINDOW_MS` | No | 900000 | Admin API rate limit window (15 min) |

**Important:** `SESSION_SECRET` must differ from `ADMIN_API_KEY` in production for security. In development, at least one of `SESSION_SECRET` or `ADMIN_API_KEY` must be set—the service will fail to start with a clear error message if neither is configured. When only `ADMIN_API_KEY` is set, it's used as the session secret and a warning is logged.

### Worker Service

The worker service handles background jobs like token cleanup. It shares the database with prompt-service.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | development | Set to `production` |
| `DATABASE_URL` | Yes | - | SQLite database path (same as prompt-service) |
| `DATABASE_KEY` | Yes | - | 32+ char encryption key (same as prompt-service) |
| `LOG_LEVEL` | No | info | Pino log level |
| `JOB_TOKEN_CLEANUP_ENABLED` | No | true | Enable token cleanup job |
| `JOB_TOKEN_CLEANUP_SCHEDULE` | No | 0 * * * * | Cron schedule (hourly default) |

**Cron Schedule Examples:**
- `0 * * * *` - Every hour at minute 0 (default)
- `*/30 * * * *` - Every 30 minutes
- `0 0 * * *` - Daily at midnight
- `0 0 * * 0` - Weekly on Sunday at midnight

## Docker Compose Configuration

Votive uses [dotenvx](https://dotenvx.com) for encrypted environment variable management. The `.env` file is encrypted and committed to the repository - you only need the decryption key to run.

### Running with Docker Compose

```bash
# Pass the decryption key - all other secrets are in the encrypted .env
DOTENV_PRIVATE_KEY=<your-private-key> docker compose up --build
```

### How It Works

| File | Description | Commit to Git? |
|------|-------------|----------------|
| `.env` | Encrypted secrets | Yes (safe) |
| `.env.keys` | Private decryption key | **Never** |
| `DOTENV_PRIVATE_KEY` | Runtime decryption | Pass via env/secrets manager |

At container startup, dotenvx decrypts the `.env` file using the private key and injects all variables into the process environment.

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

### CSRF Protection

User authentication endpoints use double-submit cookie pattern:
- CSRF token set on login/register (cookie + response body)
- Token validated for state-changing requests (POST/PUT/DELETE)
- Cookie: `csrf-token` with `sameSite: 'strict'`, `secure: true` in production
- Header: `x-csrf-token` (sent by frontend)
- Timing-safe comparison prevents timing attacks

Protected endpoints:
- `/logout`, `/logout-all`
- `/profile`, `/password`, `/account`
- `/resend-verification`
- `/assessment`, `/analysis` (save operations)

### Password Requirements

User passwords must meet:
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)

### Distributed Tracing

W3C Trace Context headers (OpenTelemetry compatible):
- `traceparent` header propagated through all services
- Format: `00-{traceId}-{spanId}-01`
- TraceId/SpanId included in all Pino log entries
- Worker jobs include trace context for correlation

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
