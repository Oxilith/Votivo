/**
 * @file prompt-service/prisma/seed.test.ts
 * @purpose Seeds the database with dummy prompt data for E2E testing
 * @functionality
 * - Creates a minimal IDENTITY_ANALYSIS prompt for E2E tests
 * - Clears all existing data before seeding
 * - Uses dummy prompt content (backend returns mock data via MOCK_CLAUDE_API)
 * - Can be safely committed to git (no sensitive prompts)
 * @dependencies
 * - @/prisma/client for database access
 */

import { prisma } from '@/prisma';

// Dummy prompt for E2E testing - backend uses MOCK_CLAUDE_API so content doesn't matter
const DUMMY_ANALYSIS_PROMPT = `You are a test prompt for E2E testing.
Return a valid JSON analysis response.`;

async function main() {
  console.log('Starting E2E test database seed...');

  // Clear existing data in correct order (respecting foreign key constraints)
  await prisma.aBVariantConfig.deleteMany();
  await prisma.aBVariant.deleteMany();
  await prisma.aBTest.deleteMany();
  await prisma.promptVersion.deleteMany();
  await prisma.promptVariant.deleteMany();
  await prisma.prompt.deleteMany();
  await prisma.analysis.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.emailVerifyToken.deleteMany();
  await prisma.user.deleteMany();

  console.log('Cleared existing data');

  // Create minimal prompt for E2E tests
  const prompt = await prisma.prompt.create({
    data: {
      key: 'IDENTITY_ANALYSIS',
      name: 'Identity Analysis (E2E Test)',
      description: 'Dummy prompt for E2E testing',
      content: DUMMY_ANALYSIS_PROMPT,
      model: 'claude-sonnet-4-5',
      isActive: true,
      variants: {
        create: [
          {
            variantType: 'withThinking',
            temperature: 1,
            maxTokens: 16000,
            thinkingType: 'enabled',
            budgetTokens: 8000,
            isDefault: true,
          },
          {
            variantType: 'withoutThinking',
            temperature: 0.6,
            maxTokens: 8000,
            thinkingType: 'disabled',
            budgetTokens: null,
            isDefault: false,
          },
        ],
      },
      versions: {
        create: {
          version: 1,
          content: DUMMY_ANALYSIS_PROMPT,
          model: 'claude-sonnet-4-5',
          changeNote: 'E2E test seed',
        },
      },
    },
  });

  console.log('Created E2E test prompt:', prompt.key);
  console.log('E2E test database seed completed!');
}

main().catch((e) => {
  console.error('E2E seed failed:', e);
  process.exit(1);
});
