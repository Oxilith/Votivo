# Identity Foundations Assessment

A behavioral psychology and habit formation application that guides users through self-discovery and provides AI-powered pattern analysis for sustainable personal change.

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

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4
- **Internationalization**: i18next (English & Polish)
- **AI Analysis**: Claude API for pattern recognition

## Getting Started

```bash
cd app
npm install
npm run dev
```

### Environment Setup

Create `.env` file in `/app`:
```
VITE_ANTHROPIC_API_KEY=your-api-key-here
```

## Project Structure

```
├── app/                    # React application
│   └── src/
│       ├── components/     # UI components (assessment, insights, shared)
│       ├── config/         # AI prompt configurations
│       ├── contexts/       # React contexts (theme)
│       ├── hooks/          # Custom React hooks
│       ├── i18n/           # Internationalization resources
│       ├── services/       # API clients
│       ├── styles/         # Theme utilities
│       ├── types/          # TypeScript interfaces
│       └── utils/          # Utility functions
├── docs/                   # Documentation
│   ├── Motivation.md       # Framework theory and glossary
│   └── InternationalizationGuide.md
└── personas/               # Sample assessment data for testing
```

## Available Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

## Framework Documentation

See [docs/Motivation.md](docs/Motivation.md) for the complete theoretical framework including:
- Core states (Mood, Energy, Motivation)
- Behavior types (Automatic, Motivation-driven, Keystone)
- Habit architecture and mechanisms
- Identity concepts and psychological principles
