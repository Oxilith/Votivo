/**
 * @file prompt-service/src/services/__tests__/ab-test.service.test.ts
 * @purpose Unit tests for ABTestService variant selection logic
 * @functionality
 * - Tests weighted random variant selection
 * - Tests edge cases (single variant, empty array)
 * - Verifies weight distribution is statistically reasonable
 * @dependencies
 * - vitest for testing framework
 * - ABTestService for service under test
 */

import { ABTestService } from '@/services';
import type { ABVariant, ABVariantConfig } from '@prisma/client';

// Create a test instance without database dependency
const abTestService = new ABTestService();

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

describe('ABTestService', () => {
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
