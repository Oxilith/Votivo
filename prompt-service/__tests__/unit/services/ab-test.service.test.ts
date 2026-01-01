/**
 * @file prompt-service/__tests__/unit/services/ab-test.service.test.ts
 * @purpose Unit tests for ABTestService CRUD and variant selection logic
 * @functionality
 * - Tests weighted random variant selection
 * - Tests edge cases (single variant, empty array)
 * - Tests getAll, getById service methods
 * - Verifies weight distribution is statistically reasonable
 * @dependencies
 * - vitest for testing framework
 * - Prisma client mock for database operations
 * - ABTestService for service under test
 */

import type { ABTest, ABVariant, ABVariantConfig } from '@votive/shared/prisma';

// Create mock Prisma object with hoisting
const mockPrismaObj = vi.hoisted(() => ({
  aBTest: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
  },
  aBVariant: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
  },
  $transaction: vi.fn(),
  $executeRaw: vi.fn(),
}));

// Mock modules
vi.mock('@/prisma', () => ({
  prisma: mockPrismaObj,
}));

// Import after mocking
import { ABTestService } from '@/services';

// Helper to create mock variant
function createMockVariant(
  id: string,
  name: string,
  weight: number
): ABVariant & { configs: ABVariantConfig[] } {
  return {
    id,
    name,
    content: 'test content',
    model: 'claude-sonnet-4-20250514',
    weight,
    abTestId: 'test-ab-test-id',
    impressions: 0,
    conversions: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    configs: [],
  };
}

// Sample data for tests
const sampleVariantConfig: ABVariantConfig = {
  id: 'config-1',
  abVariantId: 'variant-1',
  variantType: 'withThinking',
  temperature: 0.7,
  maxTokens: 4000,
  thinkingType: 'enabled',
  budgetTokens: 10000,
};

const sampleABVariant: ABVariant & { configs: ABVariantConfig[] } = {
  id: 'variant-1',
  abTestId: 'ab-test-1',
  name: 'Variant A',
  content: 'Test variant content',
  model: 'claude-sonnet-4-20250514',
  weight: 0.5,
  impressions: 100,
  conversions: 10,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  configs: [sampleVariantConfig],
};

const sampleABTest: ABTest & { variants: (ABVariant & { configs: ABVariantConfig[] })[] } = {
  id: 'ab-test-1',
  promptId: 'prompt-1',
  name: 'Test A/B',
  description: 'A/B test description',
  isActive: true,
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  variants: [sampleABVariant],
};

describe('ABTestService', () => {
  let abTestService: ABTestService;
  const mockPrisma = mockPrismaObj;

  beforeEach(() => {
    vi.clearAllMocks();
    abTestService = new ABTestService();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getAll', () => {
    it('should return all A/B tests with variants', async () => {
      mockPrisma.aBTest.findMany.mockResolvedValue([sampleABTest]);

      const result = await abTestService.getAll();

      expect(result).toEqual([sampleABTest]);
      expect(mockPrisma.aBTest.findMany).toHaveBeenCalledWith({
        include: {
          variants: {
            include: { configs: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when no A/B tests exist', async () => {
      mockPrisma.aBTest.findMany.mockResolvedValue([]);

      const result = await abTestService.getAll();

      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('should return A/B test by ID with variants', async () => {
      mockPrisma.aBTest.findUnique.mockResolvedValue(sampleABTest);

      const result = await abTestService.getById('ab-test-1');

      expect(result).toEqual(sampleABTest);
      expect(mockPrisma.aBTest.findUnique).toHaveBeenCalledWith({
        where: { id: 'ab-test-1' },
        include: {
          variants: {
            include: { configs: true },
          },
        },
      });
    });

    it('should return null for non-existent A/B test', async () => {
      mockPrisma.aBTest.findUnique.mockResolvedValue(null);

      const result = await abTestService.getById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('selectVariant', () => {
    it('should throw error when variants array is empty', () => {
      expect(() => abTestService.selectVariant([])).toThrow(
        'No variants available for selection'
      );
    });

    it('should return single variant when only one exists', () => {
      const variant = createMockVariant('v1', 'Variant A', 1.0);
      const result = abTestService.selectVariant([variant]);
      expect(result).toBe(variant);
    });

    it('should return a variant from the array', () => {
      const variants = [
        createMockVariant('v1', 'Variant A', 0.5),
        createMockVariant('v2', 'Variant B', 0.5),
      ];
      const result = abTestService.selectVariant(variants);
      expect(variants).toContain(result);
    });

    it('should respect weights over many selections', () => {
      // Create variants with 80/20 split
      const variants = [
        createMockVariant('v1', 'Variant A', 0.8),
        createMockVariant('v2', 'Variant B', 0.2),
      ];

      // Count selections over many iterations
      const counts = { v1: 0, v2: 0 };
      const iterations = 10000;

      for (let i = 0; i < iterations; i++) {
        const result = abTestService.selectVariant(variants);
        counts[result.id as keyof typeof counts]++;
      }

      // Expect v1 to be selected roughly 80% of the time (with 5% tolerance)
      const v1Percentage = counts.v1 / iterations;
      expect(v1Percentage).toBeGreaterThan(0.75);
      expect(v1Percentage).toBeLessThan(0.85);
    });

    it('should handle zero-weight variants', () => {
      const variants = [
        createMockVariant('v1', 'Variant A', 0),
        createMockVariant('v2', 'Variant B', 1.0),
      ];

      // All selections should be v2
      for (let i = 0; i < 100; i++) {
        const result = abTestService.selectVariant(variants);
        expect(result.id).toBe('v2');
      }
    });

    it('should distribute equally when all weights are equal', () => {
      const variants = [
        createMockVariant('v1', 'Variant A', 0.5),
        createMockVariant('v2', 'Variant B', 0.5),
      ];

      const counts = { v1: 0, v2: 0 };
      const iterations = 10000;

      for (let i = 0; i < iterations; i++) {
        const result = abTestService.selectVariant(variants);
        counts[result.id as keyof typeof counts]++;
      }

      // Both should be selected roughly 50% of the time (with 5% tolerance)
      const v1Percentage = counts.v1 / iterations;
      expect(v1Percentage).toBeGreaterThan(0.45);
      expect(v1Percentage).toBeLessThan(0.55);
    });

    it('should handle three variants with different weights', () => {
      const variants = [
        createMockVariant('v1', 'Variant A', 0.5),
        createMockVariant('v2', 'Variant B', 0.3),
        createMockVariant('v3', 'Variant C', 0.2),
      ];

      const counts = { v1: 0, v2: 0, v3: 0 };
      const iterations = 10000;

      for (let i = 0; i < iterations; i++) {
        const result = abTestService.selectVariant(variants);
        counts[result.id as keyof typeof counts]++;
      }

      // Verify approximate percentages (with 5% tolerance)
      expect(counts.v1 / iterations).toBeGreaterThan(0.45);
      expect(counts.v1 / iterations).toBeLessThan(0.55);
      expect(counts.v2 / iterations).toBeGreaterThan(0.25);
      expect(counts.v2 / iterations).toBeLessThan(0.35);
      expect(counts.v3 / iterations).toBeGreaterThan(0.15);
      expect(counts.v3 / iterations).toBeLessThan(0.25);
    });

    it('should use deterministic selection when Math.random is mocked', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.0);

      const variants = [
        createMockVariant('v1', 'Variant A', 0.5),
        createMockVariant('v2', 'Variant B', 0.5),
      ];

      // With random = 0, should always select first variant
      const result = abTestService.selectVariant(variants);
      expect(result.id).toBe('v1');

      vi.restoreAllMocks();
    });

    it('should select last variant when random is at upper bound', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.99);

      const variants = [
        createMockVariant('v1', 'Variant A', 0.5),
        createMockVariant('v2', 'Variant B', 0.5),
      ];

      // With random = 0.99, should select second variant
      const result = abTestService.selectVariant(variants);
      expect(result.id).toBe('v2');

      vi.restoreAllMocks();
    });
  });
});
