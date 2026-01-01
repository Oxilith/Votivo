/**
 * @file app/__tests__/unit/utils/fileUtils.test.ts
 * @purpose Unit tests for file import/export utilities
 * @functionality
 * - Tests exportToJson creates downloadable file
 * - Tests importFromJson parses JSON file
 * - Tests validateResponses type guard
 * @dependencies
 * - vitest globals
 * - fileUtils under test
 */

import { exportToJson, importFromJson, validateResponses } from '@/utils/fileUtils';
import type { AssessmentResponses } from '@/types';

// Mock DOM APIs
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = vi.fn();
const mockClick = vi.fn();
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();

// Valid sample data matching the actual REQUIRED_FIELDS from shared
const createValidResponses = (): AssessmentResponses => ({
  // Array fields
  peak_energy_times: ['mid_morning', 'afternoon'],
  low_energy_times: ['early_morning', 'late_night'],
  mood_triggers_negative: ['lack_of_progress', 'overwhelm'],
  core_values: ['growth', 'mastery', 'impact'],
  // Number fields
  energy_consistency: 4,
  motivation_reliability: 3,
  identity_clarity: 4,
  // String fields
  energy_drains: 'Meetings and administrative tasks',
  energy_restores: 'Creative work and learning',
  willpower_pattern: 'distraction',
  identity_statements: 'I am someone who values growth',
  others_describe: 'Analytical and creative',
  automatic_behaviors: 'Morning coffee routine',
  keystone_behaviors: 'Daily exercise',
  natural_strengths: 'Problem solving',
  resistance_patterns: 'Procrastination on complex tasks',
});

describe('fileUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup URL mocks
    URL.createObjectURL = mockCreateObjectURL;
    URL.revokeObjectURL = mockRevokeObjectURL;
    // Setup document mocks
    vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click: mockClick,
    } as unknown as HTMLAnchorElement);
    vi.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild);
    vi.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('exportToJson', () => {
    const sampleResponses = createValidResponses();

    it('should create blob with JSON content', () => {
      exportToJson(sampleResponses);

      expect(mockCreateObjectURL).toHaveBeenCalled();
      const blobArg = mockCreateObjectURL.mock.calls[0][0];
      expect(blobArg).toBeInstanceOf(Blob);
    });

    it('should use default filename', () => {
      exportToJson(sampleResponses);

      const createElement = document.createElement as ReturnType<typeof vi.fn>;
      const linkElement = createElement.mock.results[0].value;
      expect(linkElement.download).toBe('votive-responses.json');
    });

    it('should use custom filename when provided', () => {
      exportToJson(sampleResponses, 'custom-name.json');

      const createElement = document.createElement as ReturnType<typeof vi.fn>;
      const linkElement = createElement.mock.results[0].value;
      expect(linkElement.download).toBe('custom-name.json');
    });

    it('should trigger download click', () => {
      exportToJson(sampleResponses);
      expect(mockClick).toHaveBeenCalled();
    });

    it('should cleanup DOM and revoke URL', () => {
      exportToJson(sampleResponses);

      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });
  });

  describe('importFromJson', () => {
    const validData = createValidResponses();

    it('should parse valid JSON file', async () => {
      const file = new File([JSON.stringify(validData)], 'test.json', {
        type: 'application/json',
      });

      const result = await importFromJson(file);
      expect(result).toEqual(validData);
    });

    it('should reject invalid JSON', async () => {
      const file = new File(['not valid json'], 'test.json', {
        type: 'application/json',
      });

      await expect(importFromJson(file)).rejects.toThrow('Invalid JSON file');
    });

    it('should reject invalid response structure', async () => {
      const invalidData = { foo: 'bar' };
      const file = new File([JSON.stringify(invalidData)], 'test.json', {
        type: 'application/json',
      });

      await expect(importFromJson(file)).rejects.toThrow('Invalid response structure');
    });
  });

  describe('validateResponses', () => {
    it('should return false for null', () => {
      expect(validateResponses(null)).toBe(false);
    });

    it('should return false for non-object', () => {
      expect(validateResponses('string')).toBe(false);
      expect(validateResponses(123)).toBe(false);
      expect(validateResponses(undefined)).toBe(false);
    });

    it('should return false for missing required fields', () => {
      expect(validateResponses({})).toBe(false);
      expect(validateResponses({ peak_energy_times: ['morning'] })).toBe(false);
    });

    it('should return false for wrong array field types', () => {
      const data = {
        ...createValidResponses(),
        peak_energy_times: 'not-an-array', // Should be array
      };
      expect(validateResponses(data)).toBe(false);
    });

    it('should return false for wrong number field types', () => {
      const data = {
        ...createValidResponses(),
        energy_consistency: 'not-a-number', // Should be number
      };
      expect(validateResponses(data)).toBe(false);
    });

    it('should return false for wrong string field types', () => {
      const data = {
        ...createValidResponses(),
        energy_drains: 123, // Should be string
      };
      expect(validateResponses(data)).toBe(false);
    });

    it('should return true for valid responses', () => {
      expect(validateResponses(createValidResponses())).toBe(true);
    });
  });
});
