# Votive

> *Every action is a vote for who you're becoming.*

Self-discovery before goal-setting. Most habit apps fail because they skip the foundation—understanding who you already are.

Votive guides you through a behavioral psychology assessment, then uses AI to find patterns, contradictions, and blind spots you can't see yourself.

## The Framework

A 5-phase identity-based approach to sustainable change:

| Phase | Focus | Status |
|-------|-------|--------|
| 1. State Awareness | Energy, mood, motivation patterns | ✅ Implemented |
| 2. Identity Mapping | Current self through behaviors & values | ✅ Implemented |
| 3. Identity Design | Aspirational identity with stepping-stones | 🔜 Planned |
| 4. System Implementation | Habit loops & environment design | 🔜 Planned |
| 5. Feedback & Integration | Progress tracking & reinforcement | 🔜 Planned |

## Core Principles

- **Identity over outcomes** — "I am someone who..." beats "I want to..."
- **Keystone behaviors** — Small actions with cascading effects across life
- **Identity bridges** — Believable stepping-stones between current and aspirational self
- **Systems over motivation** — Habits bypass the unreliable need for willpower

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + Zustand
- **Backend**: Node.js + Express + TypeScript
- **Prompt Service**: Express + Prisma + SQLite (encrypted with libsql)
- **Styling**: Tailwind CSS v4
- **Internationalization**: i18next (English & Polish)
- **AI Analysis**: Claude API via backend proxy
- **Testing**: Vitest + React Testing Library (all packages)

## Getting Started

### Prerequisites
- Node.js >= 20.0.0
- Anthropic API key
- mkcert (for local HTTPS)

### HTTPS Setup (Local Development)

Generate locally-trusted certificates using mkcert:

```bash
# Install mkcert (macOS)
brew install mkcert
mkcert -install

# Install mkcert (Windows - run as Administrator)
choco install mkcert
mkcert -install

# Generate certificates (macOS/Linux)
mkdir -p certs
cd certs
mkcert localhost 127.0.0.1 ::1
cd ..

# Generate certificates (Windows PowerShell)
New-Item -ItemType Directory -Force -Path certs
cd certs
mkcert localhost 127.0.0.1 ::1
cd ..
```

### Quick Start

```bash
# Install all dependencies (from project root)
npm install

# Backend setup
cp backend/.env.example backend/.env  # Add your ANTHROPIC_API_KEY
npm run dev:backend                    # Starts on https://localhost:3001

# Frontend setup (new terminal)
npm run dev:app                        # Starts on https://localhost:3000
```

### Environment Setup

**Backend** (`/backend/.env`):
```
ANTHROPIC_API_KEY=sk-ant-...  # Required
PORT=3001
NODE_ENV=development
HTTPS_ENABLED=true
CORS_ORIGIN=https://localhost:3000
THINKING_ENABLED=true         # Enable/disable Claude extended thinking mode
```

**Frontend** (`/app/.env`):
```
VITE_API_URL=https://localhost:3001
```

## Project Structure

```
├── app/                    # React frontend
│   └── src/
│       ├── components/     # UI components (assessment/, insights/, shared/)
│       ├── contexts/       # React contexts (theme)
│       ├── i18n/           # Internationalization (en/, pl/)
│       ├── services/       # API client & service layer
│       ├── stores/         # Zustand state management
│       └── styles/         # Theme utilities
├── backend/                # Express API proxy
│   └── src/
│       ├── config/         # Environment validation (Zod)
│       ├── health/         # Health checks (prompt-service dependency)
│       ├── middleware/     # CORS, rate limiting, error handling
│       ├── routes/         # API endpoints
│       ├── services/       # Claude API, prompt client, circuit breaker, cache
│       └── utils/          # Logger (Pino)
├── prompt-service/         # Prompt management microservice
│   ├── prisma/             # SQLite schema & migrations
│   └── src/
│       ├── admin/          # React admin UI
│       ├── routes/         # REST API endpoints
│       └── services/       # Prompt CRUD, A/B testing, resolver
├── shared/                 # Shared TypeScript types
│   └── src/                # Types, validation, utilities
├── docs/                   # Documentation
└── personas/               # Sample assessment data
```

## Available Commands

This repository uses **npm workspaces** for unified dependency management. Run commands from the project root.

### Root Commands (Recommended)
```bash
npm install              # Install all workspaces
npm run lint             # Lint all projects
npm run type-check       # Type-check all projects
npm run build            # Build all projects
npm run test:run         # Run all tests (once)
npm run test:coverage    # Run all tests with coverage

# Development servers
npm run dev:app                  # Start frontend (https://localhost:3000)
npm run dev:backend              # Start backend (https://localhost:3001)
npm run dev:prompt-service       # Start prompt-service API (http://localhost:3002)
npm run dev:prompt-service:all   # Start prompt-service API + admin UI

# Production
npm run start:backend            # Run compiled backend
npm run start:prompt-service     # Run compiled prompt-service
npm run preview:app              # Preview frontend build

# Database (prompt-service)
npm run db:migrate       # Run database migrations
npm run db:generate      # Generate Prisma client
npm run db:seed          # Seed initial data
npm run db:studio        # Open Prisma Studio
```

### Workspace-Specific Commands

Commands can also be run per-workspace using `-w <workspace>`:

```bash
npm run dev -w app              # Same as npm run dev:app
npm run test -w backend         # Run backend tests only
npm run lint:fix -w shared      # Fix lint issues in shared
```

Or by navigating to the workspace directory:

```bash
cd app && npm run dev           # Start frontend dev server
cd backend && npm run test      # Run backend tests
```

### Docker

Quick deployment using pre-built multi-arch images:

```bash
# macOS/Linux
ANTHROPIC_API_KEY=<YOUR_KEY> DATABASE_KEY=<32+_CHAR_SECRET> \
  docker compose -f oci://oxilith/votive-oci:latest up

# Windows (PowerShell)
$env:ANTHROPIC_API_KEY="<YOUR_KEY>"; $env:DATABASE_KEY="<32+_CHAR_SECRET>"
docker compose -f oci://oxilith/votive-oci:latest up
```

See [Docker Hub Workflow](docs/docker-hub.md) for complete documentation including:
- Local build instructions
- HTTPS configuration
- Multi-arch image publishing (maintainers)
- Troubleshooting guide

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/architecture.md) | System design, diagrams, and technical decisions |
| [Docker Hub Workflow](docs/docker-hub.md) | Container deployment, publishing, and troubleshooting |
| [Production Deployment](docs/ClaudeDocs/production-deployment.md) | Security, configuration, and deployment best practices |
| [Motivation](docs/Motivation.md) | Theoretical framework and psychology principles |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/claude/analyze` | Submit assessment for AI analysis |
| GET | `/health` | Backend health check |

## Test Data

Sample personas available in `/personas/` for quick testing:
- `persona-1-burned-out-achiever-{en,pl}.json`
- `persona-2-scattered-creative-{en,pl}.json`
- `persona-3-careful-planner-{en,pl}.json`
