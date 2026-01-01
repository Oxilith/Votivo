/**
 * @file shared/src/testing/fixtures/analysis.fixture.ts
 * @purpose Factory functions for creating mock AI analysis results
 * @functionality
 * - Creates complete AIAnalysisResult objects
 * - Creates individual analysis components (patterns, contradictions, etc.)
 * - Creates mock Analysis database records
 * @dependencies
 * - @faker-js/faker for realistic data generation
 * - @/analysis.types for type definitions
 */

import { faker } from '@faker-js/faker';
import type {
  AIAnalysisResult,
  AnalysisPattern,
  AnalysisContradiction,
  AnalysisBlindSpot,
  AnalysisLeveragePoint,
  AnalysisRisk,
  IdentitySynthesis,
} from '@/analysis.types';
import type { JsonString } from './index';

// Icons commonly used in analysis results
const ANALYSIS_ICONS = [
  'brain',
  'heart',
  'target',
  'compass',
  'lightbulb',
  'warning',
  'star',
  'eye',
  'zap',
  'shield',
] as const;

/**
 * Creates a mock AnalysisPattern object.
 *
 * @param overrides - Optional overrides for pattern properties
 * @returns Mock AnalysisPattern
 */
export function createMockPattern(
  overrides: Partial<AnalysisPattern> = {}
): AnalysisPattern {
  return {
    title: overrides.title ?? faker.lorem.words(3),
    icon: overrides.icon ?? faker.helpers.arrayElement([...ANALYSIS_ICONS]),
    severity:
      overrides.severity ?? faker.helpers.arrayElement(['high', 'medium']),
    description: overrides.description ?? faker.lorem.paragraph(),
    evidence: overrides.evidence ?? [
      faker.lorem.sentence(),
      faker.lorem.sentence(),
    ],
    implication: overrides.implication ?? faker.lorem.sentence(),
    leverage: overrides.leverage ?? faker.lorem.sentence(),
  };
}

/**
 * Creates a mock AnalysisContradiction object.
 *
 * @param overrides - Optional overrides for contradiction properties
 * @returns Mock AnalysisContradiction
 */
export function createMockContradiction(
  overrides: Partial<AnalysisContradiction> = {}
): AnalysisContradiction {
  return {
    title: overrides.title ?? faker.lorem.words(3),
    icon: overrides.icon ?? faker.helpers.arrayElement([...ANALYSIS_ICONS]),
    description: overrides.description ?? faker.lorem.paragraph(),
    sides: overrides.sides ?? [faker.lorem.sentence(), faker.lorem.sentence()],
    hypothesis: overrides.hypothesis ?? faker.lorem.sentence(),
    question: overrides.question ?? faker.lorem.sentence() + '?',
  };
}

/**
 * Creates a mock AnalysisBlindSpot object.
 *
 * @param overrides - Optional overrides for blind spot properties
 * @returns Mock AnalysisBlindSpot
 */
export function createMockBlindSpot(
  overrides: Partial<AnalysisBlindSpot> = {}
): AnalysisBlindSpot {
  return {
    title: overrides.title ?? faker.lorem.words(3),
    icon: overrides.icon ?? faker.helpers.arrayElement([...ANALYSIS_ICONS]),
    observation: overrides.observation ?? faker.lorem.paragraph(),
    evidence: overrides.evidence ?? faker.lorem.sentence(),
    reframe: overrides.reframe ?? faker.lorem.sentence(),
  };
}

/**
 * Creates a mock AnalysisLeveragePoint object.
 *
 * @param overrides - Optional overrides for leverage point properties
 * @returns Mock AnalysisLeveragePoint
 */
export function createMockLeveragePoint(
  overrides: Partial<AnalysisLeveragePoint> = {}
): AnalysisLeveragePoint {
  return {
    title: overrides.title ?? faker.lorem.words(3),
    insight: overrides.insight ?? faker.lorem.paragraph(),
  };
}

/**
 * Creates a mock AnalysisRisk object.
 *
 * @param overrides - Optional overrides for risk properties
 * @returns Mock AnalysisRisk
 */
export function createMockRisk(
  overrides: Partial<AnalysisRisk> = {}
): AnalysisRisk {
  return {
    title: overrides.title ?? faker.lorem.words(3),
    description: overrides.description ?? faker.lorem.paragraph(),
  };
}

/**
 * Creates a mock IdentitySynthesis object.
 *
 * @param overrides - Optional overrides for synthesis properties
 * @returns Mock IdentitySynthesis
 */
export function createMockIdentitySynthesis(
  overrides: Partial<IdentitySynthesis> = {}
): IdentitySynthesis {
  return {
    currentIdentityCore:
      overrides.currentIdentityCore ?? faker.lorem.paragraph(),
    hiddenStrengths: overrides.hiddenStrengths ?? [
      faker.lorem.sentence(),
      faker.lorem.sentence(),
    ],
    keyTension: overrides.keyTension ?? faker.lorem.sentence(),
    nextIdentityStep: overrides.nextIdentityStep ?? faker.lorem.sentence(),
  };
}

/**
 * Options for creating a mock analysis result
 */
export interface MockAnalysisResultOptions {
  language?: string;
  patternCount?: number;
  contradictionCount?: number;
  blindSpotCount?: number;
  leveragePointCount?: number;
  riskCount?: number;
  patterns?: AnalysisPattern[];
  contradictions?: AnalysisContradiction[];
  blindSpots?: AnalysisBlindSpot[];
  leveragePoints?: AnalysisLeveragePoint[];
  risks?: AnalysisRisk[];
  identitySynthesis?: IdentitySynthesis;
}

/**
 * Creates a complete AIAnalysisResult object.
 *
 * @param options - Optional configuration for the analysis result
 * @returns Complete AIAnalysisResult
 *
 * @example
 * ```typescript
 * const analysis = createMockAnalysisResult({
 *   patternCount: 3,
 *   language: 'en',
 * });
 * expect(analysis.patterns).toHaveLength(3);
 * ```
 */
export function createMockAnalysisResult(
  options: MockAnalysisResultOptions = {}
): AIAnalysisResult {
  return {
    language: options.language ?? 'en',
    patterns:
      options.patterns ??
      Array.from({ length: options.patternCount ?? 2 }, () =>
        createMockPattern()
      ),
    contradictions:
      options.contradictions ??
      Array.from({ length: options.contradictionCount ?? 1 }, () =>
        createMockContradiction()
      ),
    blindSpots:
      options.blindSpots ??
      Array.from({ length: options.blindSpotCount ?? 2 }, () =>
        createMockBlindSpot()
      ),
    leveragePoints:
      options.leveragePoints ??
      Array.from({ length: options.leveragePointCount ?? 3 }, () =>
        createMockLeveragePoint()
      ),
    risks:
      options.risks ??
      Array.from({ length: options.riskCount ?? 2 }, () => createMockRisk()),
    identitySynthesis:
      options.identitySynthesis ?? createMockIdentitySynthesis(),
  };
}

/**
 * Options for creating a mock Analysis database record
 */
export interface MockAnalysisRecordOptions {
  id?: string;
  userId?: string;
  assessmentId?: string | null;
  result?: AIAnalysisResult;
  createdAt?: Date;
}

/**
 * Mock Analysis database record.
 * The result field uses JsonString to indicate it contains serialized AIAnalysisResult.
 */
export interface MockAnalysisRecord {
  id: string;
  userId: string;
  assessmentId: string | null;
  result: JsonString<AIAnalysisResult>;
  createdAt: Date;
}

/**
 * Creates a mock Analysis database record.
 * Result is JSON-stringified as it would be stored in the database.
 *
 * @param options - Optional overrides for record fields
 * @returns Mock Analysis record with JSON-stringified result
 *
 * @example
 * ```typescript
 * const analysis = createMockAnalysis({
 *   userId: 'user-123',
 *   assessmentId: 'assessment-456',
 * });
 * ```
 */
export function createMockAnalysis(
  options: MockAnalysisRecordOptions = {}
): MockAnalysisRecord {
  return {
    id: options.id ?? faker.string.uuid(),
    userId: options.userId ?? faker.string.uuid(),
    assessmentId: options.assessmentId ?? null,
    result: JSON.stringify(
      options.result ?? createMockAnalysisResult()
    ) as JsonString<AIAnalysisResult>,
    createdAt: options.createdAt ?? new Date(),
  };
}

/**
 * Creates an empty analysis result (no patterns, contradictions, etc.).
 * Useful for testing edge cases.
 *
 * @returns AIAnalysisResult with empty arrays
 */
export function createEmptyAnalysisResult(): AIAnalysisResult {
  return {
    language: 'en',
    patterns: [],
    contradictions: [],
    blindSpots: [],
    leveragePoints: [],
    risks: [],
    identitySynthesis: createMockIdentitySynthesis(),
  };
}

/**
 * App format for saved analyses (parsed JSON, ISO date strings).
 * Use this type for app store tests where data is already parsed.
 */
export interface SavedAnalysisApp {
  id: string;
  userId: string;
  assessmentId: string | null;
  result: AIAnalysisResult;
  language: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Extended options for creating a mock saved analysis (app format)
 */
export interface MockSavedAnalysisOptions extends MockAnalysisRecordOptions {
  language?: string;
  updatedAt?: Date;
}

/**
 * Creates a mock analysis in app format (parsed result, ISO date strings).
 * Use this for testing app stores where data has already been processed.
 *
 * @param options - Optional overrides for record fields
 * @returns Mock analysis in app-ready format
 *
 * @example
 * ```typescript
 * const analysis = createMockSavedAnalysis({ userId: 'user-123' });
 * expect(analysis.result.patterns).toBeDefined();
 * ```
 */
export function createMockSavedAnalysis(
  options: MockSavedAnalysisOptions = {}
): SavedAnalysisApp {
  const now = new Date();

  return {
    id: options.id ?? faker.string.uuid(),
    userId: options.userId ?? faker.string.uuid(),
    assessmentId: options.assessmentId ?? null,
    result: options.result ?? createMockAnalysisResult(),
    language: options.language ?? 'english',
    createdAt: (options.createdAt ?? now).toISOString(),
    updatedAt: (options.updatedAt ?? now).toISOString(),
  };
}
