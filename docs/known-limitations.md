# Architecture Documentation

## Known Limitations

### In-Memory Prompt Cache

The backend's `PromptCacheService` (`backend/src/services/prompt-cache.service.ts`) uses an in-memory Map for caching prompt configurations.

#### Current Behavior

- **Per-Process Cache**: Each backend instance maintains its own independent cache
- **TTL-Based Freshness**: Entries are considered fresh for 5 minutes (configurable via `PROMPT_CACHE_TTL_MS`)
- **Stale TTL**: Entries are deleted after 1 hour (configurable via `PROMPT_STALE_TTL_MS`)
- **LRU Eviction**: Cache limited to 100 entries, evicts least recently used when full

#### Multi-Instance Deployment Considerations

In a horizontally scaled environment with multiple backend instances:

1. **No Cache Synchronization**: Each instance operates with its own cache state
2. **Update Propagation Delay**: When prompts are updated in the prompt-service:
   - Active instances may serve stale cached prompts
   - Updates propagate as caches naturally expire (up to STALE_TTL)
   - No immediate invalidation mechanism across instances

3. **Request Distribution Impact**: Users may receive different prompt versions depending on which instance handles their request during the propagation window

#### Recommendations for Production Scaling

For deployments requiring strict cache consistency:

1. **Redis Shared Cache**: Replace in-memory Map with Redis for centralized cache storage
   - Enables instant cache invalidation across all instances
   - Supports cache key patterns for bulk operations

2. **Cache Invalidation Webhook**: Add an endpoint that can be triggered by the prompt-service when prompts are updated
   - Each instance clears relevant cache entries on notification
   - Requires service mesh or internal networking

3. **Reduce TTL Values**: For stricter consistency, reduce cache TTL at the cost of more prompt-service requests

4. **Accept Eventual Consistency**: For many use cases, the current behavior is acceptable:
   - Prompts typically change infrequently
   - 1-hour maximum propagation delay is often acceptable
   - Circuit breaker ensures service reliability during high load

#### Configuration

Environment variables to tune cache behavior:

```env
# How long entries are considered "fresh" (default: 5 minutes)
PROMPT_CACHE_TTL_MS=300000

# Maximum age before entry is deleted (default: 1 hour)
PROMPT_STALE_TTL_MS=3600000
```

## Circuit Breaker Configuration

The backend uses the Opossum circuit breaker library to protect against cascading failures when the prompt-service is unavailable.

### Default Settings

| Setting | Value | Environment Variable |
|---------|-------|---------------------|
| Timeout | 10,000ms | `CIRCUIT_BREAKER_TIMEOUT` |
| Error Threshold | 50% | `CIRCUIT_BREAKER_ERROR_THRESHOLD` |
| Reset Timeout | 30,000ms | `CIRCUIT_BREAKER_RESET_TIMEOUT` |

### Behavior

1. **Closed State**: Normal operation, all requests pass through
2. **Open State**: After error threshold exceeded, requests fail immediately
3. **Half-Open State**: After reset timeout, allows one test request
4. **Recovery**: When circuit closes, automatically refreshes cached prompts

## Rate Limiting Configuration

### Prompt Service

| Endpoint | Window | Max Requests | Purpose |
|----------|--------|--------------|---------|
| `/api/auth/*` | 1 minute | 5 | Prevent brute-force attacks |
| `/api/prompts/*` | 15 minutes | 100 | Admin operations |
| `/api/ab-tests/*` | 15 minutes | 100 | Admin operations |
| `/api/resolve/*` | 1 minute | 1,000 | Service-to-service (lenient) |

### Backend

| Endpoint | Window | Max Requests | Purpose |
|----------|--------|--------------|---------|
| General | 1 minute | 10 | Default protection |
| Claude API | 1 minute | 5 | Expensive operations |

## Frontend Bundle Size

### Current Implementation

The frontend uses React.lazy() for route-based code splitting. Major page components are lazy-loaded:

- `LandingPage`
- `IdentityFoundationsAssessment`
- `IdentityInsightsAI`
- `AuthPage`
- `ProfilePage`
- `EmailVerificationPage`
- `PasswordResetPage`

Each route loads only when navigated to, reducing initial bundle size.

### Future Optimization Options

If further bundle size reduction is needed, consider these additional strategies:

#### 1. i18n Namespace Splitting

**Estimated savings: 20-30 kB**

Currently all translation files (EN + PL, 14 namespaces) are loaded eagerly in `app/src/i18n/config.ts`.

Optimization approach:
- Detect user language early
- Load only the detected language initially
- Lazy-load secondary language on demand
- Split translations by route (assessment, insights, landing, auth, profile)

#### 2. Vendor Chunk Separation

**Benefit: Better caching**

Configure Vite to separate large vendor libraries into their own chunks:

```typescript
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-react': ['react', 'react-dom'],
        'vendor-i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
        'vendor-ui': ['lucide-react'],
      }
    }
  }
}
```

This improves cache hit rates when only application code changes.
