# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Identity Foundations Assessment - a behavioral psychology and habit formation application with:

1. **Motivation.md** (`/docs`) - Comprehensive framework documentation defining the psychological model (5 phases: State Awareness, Identity Mapping, Identity Design, System Implementation, Feedback & Integration)
2. **React Application** (`/app`) - Vite + React + TypeScript implementation of the assessment flow

## Build Commands

```bash
cd app

# Install dependencies
npm install

# Development server
npm run dev

# Build for production (TypeScript + Vite)
npm run build

# Lint code
npm run lint

# Type check only
npx tsc --noEmit
```

## Code Standards

### TypeScript
- **No `any` types** - use specific types or `unknown` when type cannot be determined
- **Path aliases** - always use `@/` imports (e.g., `@/components/shared/Header`), never relative paths
- **Strict mode** enabled with `noUnusedLocals`, `noUnusedParameters`
- Use `React.ComponentRef` (not deprecated `React.ElementRef`)

### Documentation Headers
Every component/service must have JSDoc header:
```typescript
/**
 * @file src/path/to/file.ts
 * @purpose Single sentence describing business value (max 25 words)
 * @functionality
 * - Bullet point describing feature 1
 * - Bullet point describing feature 2
 * @dependencies
 * - React hooks used
 * - Custom components with paths
 * - External libraries
 */
```

## React Application Architecture (`/app`)

### Key Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Root component - manages view state and response data |
| `src/components/assessment/` | Multi-phase questionnaire wizard |
| `src/components/insights/` | Claude API integration for pattern analysis |
| `src/components/shared/Header.tsx` | Navigation, theme toggle, export dropdown |
| `src/services/claudeClient.ts` | Reusable Claude API client |
| `src/config/prompts.ts` | AI prompt configurations (PromptConfig objects) |
| `src/styles/theme.ts` | Shared Tailwind theme utilities (cardStyles, textStyles) |
| `src/types/assessment.types.ts` | TypeScript interfaces for all data structures |
| `src/types/prompt.types.ts` | ClaudeModel enum and PromptConfig interface |

### Styling System
- **Tailwind CSS v4** with PostCSS
- **Theme utilities** in `src/styles/theme.ts` - shared card/text styles for consistency
- **Dark/light mode** via `ThemeContext` + `ThemeProvider`

### Internationalization
- **i18next** with browser language detection
- Languages: English (`src/i18n/resources/en/`) and Polish (`src/i18n/resources/pl/`)
- Translation files: `common.json` for each language
- See `/docs/InternationalizationGuide.md` for i18n architecture details

### Application Flow

1. **Assessment View** (default) - Multi-phase questionnaire collecting:
   - Phase 1: Energy patterns, mood triggers, willpower patterns
   - Phase 2: Identity statements, behaviors, values, strengths
   - Synthesis: Summary of all responses

2. **Insights View** - AI-powered analysis via Claude API displaying:
   - Patterns, contradictions, blind spots
   - Leverage points, risks
   - Identity synthesis with next steps

### Data Management

- **Import**: Load responses from JSON file
- **Export Responses**: Download assessment responses as JSON
- **Export Analysis**: Download AI analysis results as JSON
- **Load Sample**: Quick-fill with test data from `/personas` directory

### Environment Variables

Create `.env` file in `/app`:
```
VITE_ANTHROPIC_API_KEY=your-api-key-here
```

## Domain Framework (Motivation.md)

The psychological model is structured in 5 phases:

1. **State Awareness** - Energy patterns, mood triggers, motivation reliability
2. **Identity Mapping** - Current self-identity revealed through behaviors
3. **Identity Design** - Aspirational identity with stepping-stones
4. **System Implementation** - Habit loops, environment design
5. **Feedback & Integration** - Progress tracking and reinforcement

Key concepts:
- **Habit Loop**: Cue → Craving → Response → Reward
- **Keystone Behaviors**: Actions with cascading positive effects
- **Identity-Based Goals**: "I am someone who..." (not "I want to...")
- **Identity Gap/Bridge**: Manageable distance between current and aspirational self

## AI Analysis Output Schema

The Claude API expects to return JSON with:
- `patterns` - Behavioral patterns with evidence and leverage points
- `contradictions` - Tensions between values and behaviors
- `blindSpots` - Things revealed by data but not seen by user
- `leveragePoints` - High-ROI areas for change
- `risks` - Why change attempts might fail
- `identitySynthesis` - Core identity, hidden strengths, key tension, next identity step

## Test Data

Sample persona files in `/personas`:
- `persona-1-burned-out-achiever-{en,pl}.json`
- `persona-2-scattered-creative-{en,pl}.json`
- `persona-3-careful-planner-{en,pl}.json`
