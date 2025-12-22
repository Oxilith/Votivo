# Identity Foundations Assessment

A full-stack behavioral psychology and habit formation application that guides users through self-discovery and provides AI-powered pattern analysis for sustainable personal change.

## Overview

This application implements a 5-phase framework for identity-based habit formation:

1. **State Awareness** - Understanding fluctuating states (mood, energy, motivation patterns)
2. **Identity Mapping** - Discovering current self-identity through behaviors and values
3. **Identity Design** - Defining aspirational identity with achievable stepping-stones
4. **System Implementation** - Building habit loops and environment design
5. **Feedback & Integration** - Tracking progress and reinforcing identity through behavioral evidence

## Key Concepts

- **Habit Loop**: Cue → Craving → Response → Reward
- **Keystone Behaviors**: Actions with cascading positive effects across life domains
- **Identity-Based Goals**: "I am someone who..." rather than "I want to..."
- **Identity Bridge**: Intermediate identities connecting current self to aspirational self

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + Zustand
- **Backend**: Node.js + Express + TypeScript
- **Styling**: Tailwind CSS v4
- **Internationalization**: i18next (English & Polish)
- **AI Analysis**: Claude API via backend proxy
- **Testing**: Vitest + React Testing Library

## Getting Started

### Prerequisites
- Node.js >= 20.0.0
- Anthropic API key

### Quick Start

```bash
# Backend setup
cd backend
npm install
cp .env.example .env  # Add your ANTHROPIC_API_KEY
npm run dev           # Starts on localhost:3001

# Frontend setup (new terminal)
cd app
npm install
npm run dev           # Starts on localhost:5174
```

### Environment Setup

**Backend** (`/backend/.env`):
```
ANTHROPIC_API_KEY=sk-ant-...  # Required
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5174
```

**Frontend** (`/app/.env`):
```
VITE_API_URL=http://localhost:3001
```

## Project Structure

```
├── app/                    # React frontend
│   └── src/
│       ├── components/     # UI components (assessment/, insights/, shared/)
│       ├── config/         # AI prompt configurations
│       ├── contexts/       # React contexts (theme)
│       ├── i18n/           # Internationalization (en/, pl/)
│       ├── services/       # API client & service layer
│       ├── stores/         # Zustand state management
│       ├── styles/         # Theme utilities
│       └── types/          # TypeScript interfaces
├── backend/                # Express API proxy
│   └── src/
│       ├── config/         # Environment validation (Zod)
│       ├── middleware/     # CORS, rate limiting, error handling
│       ├── routes/         # API endpoints
│       ├── services/       # Claude API integration
│       └── utils/          # Logger (Pino)
├── docs/                   # Documentation
│   ├── Motivation.md       # Framework theory
│   └── ClaudeDocs/         # Claude Code guidance
└── personas/               # Sample assessment data
```

## Available Commands

### Frontend (`/app`)
```bash
npm run dev           # Start Vite dev server
npm run build         # Production build
npm run lint          # Run ESLint
npm run type-check    # TypeScript check
npm run test          # Run tests (watch)
npm run test:run      # Run tests (once)
npm run test:coverage # Tests with coverage
```

### Backend (`/backend`)
```bash
npm run dev           # Start with hot reload
npm run build         # Compile TypeScript
npm run start         # Run production build
npm run lint          # Run ESLint
npm run test          # Run tests
```

### Docker
```bash
docker-compose up     # Start full stack
```

## Framework Documentation

See [docs/Motivation.md](docs/Motivation.md) for the complete theoretical framework including:
- Core states (Mood, Energy, Motivation)
- Behavior types (Automatic, Motivation-driven, Keystone)
- Habit architecture and mechanisms
- Identity concepts and psychological principles

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
