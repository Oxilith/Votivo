# Votive Codebase Conventions

## Module System & Imports

### Path Aliases
- **Always** use `@/*` path alias for internal imports within a package
- **Never** use relative paths like `../` or `../../` for internal imports
- **Never** add `.js` extensions to imports
```typescript
// ✅ Correct
import { config } from '@/config';
import { logger } from '@/utils';
import { ClaudeService } from '@/services';
import { ApiResponse } from 'shared';

// ❌ Wrong
import { config } from '../config/index.js';
import { logger } from '../../utils/logger.js';
import { ApiResponse } from 'shared/index.js';
```

### Barrel Exports

#### Rules
1. **Every directory with 2+ related exports gets a barrel** (`index.ts`)
2. **Import from barrels, not files** — always import from directory
3. **Max 4 barrel levels** — leaf → mid → feature → root
4. **Be selective** — only re-export what consumers need
5. **No circular re-exports** — barrel A must not re-export from barrel B if B imports from A
```typescript
// ✅ Correct - import from barrel
import { config, logger, validateEnv } from '@/config';

// ❌ Wrong - import from specific file
import { config } from '@/config/env';
import { logger } from '@/config/logger';
```

#### Creating Barrel Exports
```typescript
// Leaf: icons/index.ts
export { CheckIcon } from './CheckIcon';
export { CloseIcon } from './CloseIcon';

// Mid: components/index.ts
export { Button } from './Button';
export { CheckIcon, CloseIcon } from './icons';

// Root: feature/index.ts (public API)
export { Button } from './components';
```
```typescript
// src/services/index.ts
export { ClaudeService } from './claude.service';
export { PromptService } from './prompt.service';
export type { ServiceConfig } from './types';
```

#### Cross-Package Imports
- Import from `shared` package directly (resolved via node_modules symlink)
- Never use relative paths to other workspaces
```typescript
// ✅ Correct
import { ApiResponse, ValidationError } from 'shared';

// ❌ Wrong
import { ApiResponse } from '../../../shared/src/index';
```

#### Anti-patterns
- `export * from './subdir'` without auditing what it exposes
- Importing from specific files when barrel exists
- 4+ levels of nested barrels
- Re-exporting internal/private utilities

---

## Build System

### Package Build Tools

| Package | Build Tool | Command | Output |
|---------|-----------|---------|--------|
| shared | tsup | `npm run build -w shared` | `shared/dist/` |
| backend | tsup | `npm run build -w backend` | `backend/dist/` |
| worker | tsup | `npm run build -w worker` | `worker/dist/` |
| prompt-service | tsup + vite | `npm run build -w prompt-service` | `prompt-service/dist/` |
| app | tsc + vite | `npm run build -w app` | `app/dist/` |

### Build Order
Shared must build first - other packages depend on it:
```bash
npm run build -w shared && npm run build -w backend  # etc.
```

### tsup.config.ts Pattern
When creating/modifying tsup config:
```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/**/*.ts', '!src/**/__tests__/**', '!src/**/*.test.ts', '!src/**/*.spec.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
});
```

**Critical:** Always exclude test files from entry points.

---

## TypeScript Configuration

### Base Config
All packages extend `tsconfig.base.json` from root:
```json
// tsconfig.base.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Package tsconfig.json Pattern
Each package extends base and adds package-specific settings:
```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "src/**/__tests__/**", "src/**/*.test.ts"]
}
```

### Docker Consideration
Dockerfiles must copy `tsconfig.base.json` to root before building:
```dockerfile
COPY tsconfig.base.json ./
```

### Module Resolution
- All packages use `"moduleResolution": "Bundler"` (inherited from base)
- **Never** use `"moduleResolution": "NodeNext"` (requires .js extensions)

### Adding New Path Aliases
If you need additional aliases, update both:
1. `tsconfig.json` → `paths`
2. `tsup.config.ts` or `vite.config.ts` → `resolve.alias`

---

## npm Workspaces

### Structure
```
root/
├── package.json          # workspaces: ["shared", "backend", "app", ...]
├── shared/               # Shared types and utilities
├── backend/              # Express API server
├── worker/               # Background job processor
├── prompt-service/       # Prompt management + admin UI
└── app/                  # React frontend
```

### Workspace Dependencies
- Internal packages use `"shared": "*"` in dependencies
- Resolved via node_modules symlink, not file: protocol
```json
{
  "dependencies": {
    "shared": "*"
  }
}
```

### Running Workspace Commands
```bash
npm run build -w shared        # Build specific workspace
npm run test --workspaces      # Run across all workspaces
npm install -D tsup -w backend # Install to specific workspace
```

---

## Docker Considerations

### Required COPY for Build
When modifying Dockerfiles, ensure these are copied:
- `package.json` and `package-lock.json`
- `tsconfig.base.json` (to root `/app/`)
- `tsconfig.json` (to package directory)
- `tsup.config.ts` (for tsup packages)
- `vite.config.ts` (for vite packages)
- Source files (`src/`)

Example:
```dockerfile
# Root level
COPY package.json package-lock.json ./
COPY tsconfig.base.json ./

# Package level
COPY shared/package.json shared/
COPY shared/tsconfig.json shared/
COPY shared/tsup.config.ts shared/
COPY shared/src shared/src
```

### Prisma Location
In npm workspaces, Prisma generates to **root** `node_modules/.prisma`:
```dockerfile
# ✅ Correct
COPY --from=builder /app/node_modules/.prisma node_modules/.prisma

# ❌ Wrong
COPY --from=builder /app/worker/node_modules/.prisma worker/node_modules/.prisma
```

---

## Testing

### Test File Locations
- Unit tests: `src/**/__tests__/*.test.ts` or `src/**/*.test.ts`
- Integration tests: `src/**/__tests__/*.integration.test.ts`

### Test Exclusions
Tests are excluded from:
- tsup builds (via entry glob negation)
- tsconfig includes (via exclude array)
- Production Docker images

---

## Common Mistakes to Avoid

### ❌ Don't Do This
```typescript
// Adding .js extensions
import { foo } from './bar.js';

// Relative imports across directories
import { config } from '../../config/index';

// Importing from shared with path
import { types } from '../../../shared/src/types';

// Using require()
const config = require('./config');
```

### ✅ Do This Instead
```typescript
// Clean extensionless imports
import { foo } from './bar';

// Path alias imports
import { config } from '@/config';

// Shared package imports
import { types } from 'shared';

// ES module imports only
import { config } from '@/config';
```

---

## Adding New Packages

1. Create directory with `package.json`:
```json
{
  "name": "@votive/new-package",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsup",
    "dev": "tsx watch src/index.ts"
  },
  "dependencies": {
    "shared": "*"
  }
}
```

2. Add standalone `tsconfig.json` (copy pattern from existing package)

3. Add `tsup.config.ts` (copy pattern from existing package)

4. Add to root `package.json` workspaces array

5. Run `npm install` to create symlinks

6. Add to root build script in correct order

---

## Quick Reference

| Task | Command |
|------|---------|
| Install all deps | `npm install` |
| Build everything | `npm run build` |
| Build one package | `npm run build -w <package>` |
| Type check | `npm run type-check` |
| Lint | `npm run lint` |
| Test | `npm run test` |
| Clean all | `npm run clean` |
| Docker build | `docker compose build` |