## [1.1.0] - 2025-12-30

### Added
- Standardized barrel exports (`index.ts`) across all packages for cleaner imports
- npm workspaces for unified dependency management and module resolution
- tsup bundler for server packages (shared, backend, worker, prompt-service)
- Build verification script to validate workspace symlinks and dist structure

### Changed
- Migrated from `*.js` extension imports to extensionless `@/*` path aliases
- Switched moduleResolution from NodeNext to Bundler across all packages
- Build tooling unified: tsup for server packages, Vite for frontend apps
- Dockerfiles simplified from tarball pattern to npm workspaces (~40% fewer lines)
- tsconfigs made standalone for better Docker build compatibility
- All internal imports now use `@/` prefix for consistency

### Removed
- tsc-alias dependency (no longer needed with tsup)
- Manual tarball packaging in Docker builds
- Redundant tsconfig.base.json extends pattern in Docker context

### Developer Experience
- Cleaner imports: `import { config } from '@/config'` instead of `import { config } from '../config/index.js'`
- Faster builds with tsup's esbuild-powered bundling
- Simplified Docker builds with consistent module resolution in dev and production

## [1.0.7] - 2025-12-29

### Added
- CSRF protection using double-submit cookie pattern for all state-changing auth endpoints
- W3C Trace Context (OpenTelemetry-compatible) distributed tracing across backend, prompt-service, and worker
- Password strength validation requiring uppercase, lowercase, and number (8+ chars)
- Email rate limiting (5 verification emails per hour per user)
- CSRF middleware tests (15 tests)
- Tracing utilities in shared package (`shared/src/tracing.ts`)

### Changed
- Frontend ApiClient now automatically includes CSRF token for POST/PUT/DELETE requests
- TokenVerificationResult refactored to discriminated union for better type safety
- Worker scheduler logs now include traceId and spanId for distributed tracing
- Login/register responses now include CSRF token for immediate client use

### Security
- CSRF tokens validated with timing-safe comparison
- CSRF cookie uses `sameSite: 'strict'` and `secure: true` in production
- Password requirements enforced on registration, password reset, and password change
- Refresh token race condition fixed by moving database lookup inside transaction

## [1.0.6] - 2025-12-29

### Added
- Worker microservice for background job scheduling (`/worker`)
- Generic job scheduler using node-cron with extensible job interface
- Token cleanup job that removes expired refresh, password reset, and email verification tokens
- Per-route rate limiting middleware with factory pattern
- Environment-configurable rate limits for all authentication endpoints
- Timing-safe password hashing in registration to prevent email enumeration
- Unit tests for UserService (51 tests covering all auth flows)
- Unit tests for EmailService (29 tests covering email delivery)
- Worker Dockerfile and docker-compose integration

### Changed
- Rate limiting now per-endpoint: login/register (5/min), password reset (3/min), user data (30/min)
- Updated production deployment documentation with worker service configuration
- CLAUDE.md updated with worker microservice and rate limiting architecture

### Security
- Added timing-safe hash when checking existing emails during registration
- Implemented aggressive rate limiting for brute force protection on auth endpoints
- Token cleanup job prevents database bloat from expired tokens

## [1.0.5] - 2025-12-29

### Added
- Consistent page structure across Landing, Assessment, and Insights pages (ink brush SVG, floating navigation, footer)
- New icon components: SearchIcon, TargetIcon, MirrorIcon, AlertTriangleIcon, RefreshIcon
- Navigation link from Insights back to Assessment for response editing
- Extended NavigationControls to support synthesis step with `isSynthesis` and `onComplete` props
- Extended InsightsProps interface with `onNavigateToLanding` and `onNavigateToAssessment` callbacks
- Design system documentation for consistent page structure requirements

### Changed
- Replaced all emoji icons with proper SVG icon components in IdentityInsightsAI
- Tab icons now use ReactNode type for flexibility
- SynthesisStep no longer handles its own navigation (delegated to NavigationControls)
- Removed Header component from App.tsx (navigation now inline per page)
- Design system version bumped to 1.2.0

### Fixed
- Insights page now matches Assessment page styling (background, decorations, navigation)
- Consistent icon color theming using `currentColor` pattern across all icon components

## [1.0.4] - 2025-12-28

### Added
- Paper texture overlay (washi grain SVG noise filter) for atmospheric depth
- Fixed ink brush decoration at 80vh with SVG stroke drawing animation
- Ma-vertical divider brush reveal animation on scroll
- Ink splatter hover effect on stone cards
- Quote marks fade-in animation for blockquotes
- Calligraphic underline on navigation links (clip-path brush stroke)
- Button active/press state with scale(0.96) shrink effect
- Opacity-only animation pattern (`fade-up-opacity`) for interactive elements
- Organic rotation on card reveal (-0.5deg/0.5deg alternating)

### Changed
- Relocated design system from `docs/DesignPropositions/` to `docs/votive-ink-design-system.md`
- Updated README.md documentation table to include design system reference
- Updated CLAUDE.md with design system section linking to documentation
- Design system version bumped to 1.1.0

### Fixed
- Button animations now work correctly with hover lift and active shrink states
- Resolved CSS animation `forwards` fill-mode blocking hover/active transforms

## [1.0.3] - 2025-12-28

### Added
- Graphiti memory skill (`/graphiti-memory`) for knowledge graph operations with pre-configured group ID, naming conventions, and anti-patterns guidance

### Changed
- Updated CLAUDE.md Graphiti section to reference dedicated skill instead of inline documentation

## [1.0.2] - 2025-12-28

### Fixed
- Removed hardcoded fallback cookie signing secret that could be exploited if environment variables are not properly configured. The application now requires explicit configuration of SESSION_SECRET or ADMIN_API_KEY for secure session management.

## [1.0.1] - 2025-12-28

### Added
- BackgroundRefreshManager utility for background task management with queue limiting, retry logic, and exponential backoff
- fetchWithTimeout utility consolidating duplicated AbortController patterns
- New reusable icon component library for consistent SVG icons across the application
- Extracted InsightCard as a standalone component for better maintainability
- Comprehensive unit tests for InsightCard component
- getCachedKeys() method for dynamic cache recovery

### Changed
- PromptClientService now uses BackgroundRefreshManager for background cache refresh
- Icon system extended with 'xs' size variant (12px) across all icon components
- Improved code organization by separating InsightCard component from IdentityInsightsAI
- Standardized all icon viewBoxes to 24x24 coordinate system
- Cache recovery now dynamically refreshes cached prompts instead of using hardcoded list
- Enhanced icon barrel export with comprehensive usage documentation

### Fixed
- Standardized icon implementations to use centralized icon component
- Removed unsafe type assertions in insight card analysis patterns
- Empty evidence arrays no longer render "Evidence" label in InsightCard

## [1.0.0] - 2025-12-28

### Added
- Claude GitHub Actions workflows for automated CI/CD
- Dependabot auto-merge workflow for dependency management
- HTTPS support with mkcert configuration
- Extended thinking feature flag
- Multi-architecture Docker support with OCI deployment
- Backend API proxy with shared types package
- Repository governance files and templates
- Manual workflow dispatch trigger for CI pipeline
- Windows PowerShell and mkcert setup instructions

### Changed
- Renamed application to Votive
- Restructured navigation header with view indicators and landing integration
- Unified health check routes and improved backend code quality
- Consolidated duplicated code into shared package
- Updated Docker configuration with latest image tags and path alias resolution
- Changed license to Votive Source Available License
- Updated README with multi-architecture Docker publishing and platform selection

### Fixed
- Critical code scanning security issues in workflows
- Go stdlib and npm vulnerabilities (CVE-2025-* series)
- Vite and Vitest esbuild vulnerability
- Shared package resolution and type inference issues
- Assessment navigation and stale analysis problems
- Nginx timeout configuration
- Backend lint errors and frontend test failures
- CI installation of shared package dependencies

### Other Changes
- Dependency updates: codecov/codecov-action, actions/setup-node, actions/checkout, actions/upload-artifact
- Added --passWithNoTests flag to backend test scripts
- Updated environment variable documentation
- Updated issue templates
- Relocated CLAUDE.md and added landing page design propositions
