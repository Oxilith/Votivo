// scripts/hoist-common-deps.mjs

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const DEV_DEPS_TO_REMOVE = [
  // In all 5 workspaces
  'typescript',
  'eslint',
  'typescript-eslint',
  '@types/node',
  // In 4/5 workspaces
  '@vitest/coverage-v8',
  '@eslint/js',
  'tsup',
  // In 3/5 workspaces
  '@typescript-eslint/eslint-plugin',
  '@typescript-eslint/parser',
];

const DEPS_TO_REMOVE = [
  // In 4/5 workspaces (backend, prompt-service, worker, shared)
  'zod',
];

const WORKSPACES = [
  'app',
  'backend',
  'prompt-service',
  'worker',
  'shared',
];

console.log('Removing common dependencies from workspace package.json files...\n');

for (const workspace of WORKSPACES) {
  const pkgPath = join(workspace, 'package.json');
  console.log(`Processing ${pkgPath}...`);

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  let modified = false;

  // Remove devDependencies
  for (const dep of DEV_DEPS_TO_REMOVE) {
    if (pkg.devDependencies?.[dep]) {
      console.log(`  Removing devDep: ${dep}`);
      delete pkg.devDependencies[dep];
      modified = true;
    }
  }

  // Remove dependencies
  for (const dep of DEPS_TO_REMOVE) {
    if (pkg.dependencies?.[dep]) {
      console.log(`  Removing dep: ${dep}`);
      delete pkg.dependencies[dep];
      modified = true;
    }
  }

  if (modified) {
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  }

  console.log('');
}

console.log('Done removing packages from workspaces.\n');
console.log('Now run the following to install at root level (latest versions):\n');
console.log(`# DevDependencies:
npm install -D \\
  typescript \\
  eslint \\
  typescript-eslint \\
  @types/node \\
  @vitest/coverage-v8 \\
  @eslint/js \\
  tsup \\
  @typescript-eslint/eslint-plugin \\
  @typescript-eslint/parser

# Dependencies:
npm install zod\n`);
console.log('Then run: npm install');
