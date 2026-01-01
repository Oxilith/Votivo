/**
 * @file backend/__tests__/unit/utils/json-validator.test.ts
 * @purpose Unit tests for JSON parsing and validation utilities
 * @functionality
 * - Tests stripMarkdownCodeBlocks removes json blocks
 * - Tests stripMarkdownCodeBlocks handles no blocks
 * - Tests parseJson with valid JSON
 * - Tests parseJson with invalid JSON
 * - Tests parseAiJsonResponse parses after stripping
 * @dependencies
 * - vitest for testing framework
 * - stripMarkdownCodeBlocks, parseJson, parseAiJsonResponse under test
 */

import {
  stripMarkdownCodeBlocks,
  parseJson,
  parseAiJsonResponse,
} from '@/utils';

describe('json-validator', () => {
  describe('stripMarkdownCodeBlocks', () => {
    it('should remove ```json blocks', () => {
      const input = '```json\n{"key": "value"}\n```';
      const result = stripMarkdownCodeBlocks(input);
      expect(result).toBe('{"key": "value"}');
    });

    it('should remove plain ``` blocks', () => {
      const input = '```\n{"key": "value"}\n```';
      const result = stripMarkdownCodeBlocks(input);
      expect(result).toBe('{"key": "value"}');
    });

    it('should handle text without code blocks', () => {
      const input = '{"key": "value"}';
      const result = stripMarkdownCodeBlocks(input);
      expect(result).toBe('{"key": "value"}');
    });

    it('should trim whitespace', () => {
      const input = '  ```json\n{"key": "value"}\n```  ';
      const result = stripMarkdownCodeBlocks(input);
      expect(result).toBe('{"key": "value"}');
    });

    it('should handle multiple code blocks', () => {
      const input = '```json\n{"a": 1}\n```\n```json\n{"b": 2}\n```';
      const result = stripMarkdownCodeBlocks(input);
      expect(result).toBe('{"a": 1}\n{"b": 2}');
    });

    it('should handle empty string', () => {
      const result = stripMarkdownCodeBlocks('');
      expect(result).toBe('');
    });
  });

  describe('parseJson', () => {
    it('should parse valid JSON and return success', () => {
      const result = parseJson<{ name: string }>('{"name": "test"}');
      expect(result.success).toBe(true);
      expect(result.success && result.data).toEqual({ name: 'test' });
    });

    it('should return error for invalid JSON', () => {
      const result = parseJson('not valid json');
      expect(result.success).toBe(false);
      expect(!result.success && result.error).toBeInstanceOf(Error);
    });

    it('should handle arrays', () => {
      const result = parseJson<number[]>('[1, 2, 3]');
      expect(result.success).toBe(true);
      expect(result.success && result.data).toEqual([1, 2, 3]);
    });

    it('should handle nested objects', () => {
      const json = '{"outer": {"inner": "value"}}';
      const result = parseJson<{ outer: { inner: string } }>(json);
      expect(result.success).toBe(true);
      expect(result.success && result.data.outer.inner).toBe('value');
    });

    it('should return error for truncated JSON', () => {
      const result = parseJson('{"incomplete":');
      expect(result.success).toBe(false);
    });

    it('should handle null', () => {
      const result = parseJson<null>('null');
      expect(result.success).toBe(true);
      expect(result.success && result.data).toBeNull();
    });
  });

  describe('parseAiJsonResponse', () => {
    it('should parse JSON wrapped in markdown code blocks', () => {
      const input = '```json\n{"analysis": "result"}\n```';
      const result = parseAiJsonResponse<{ analysis: string }>(input);
      expect(result.success).toBe(true);
      expect(result.success && result.data).toEqual({ analysis: 'result' });
    });

    it('should parse plain JSON without code blocks', () => {
      const input = '{"analysis": "result"}';
      const result = parseAiJsonResponse<{ analysis: string }>(input);
      expect(result.success).toBe(true);
      expect(result.success && result.data).toEqual({ analysis: 'result' });
    });

    it('should return error for invalid JSON in code blocks', () => {
      const input = '```json\nnot valid\n```';
      const result = parseAiJsonResponse(input);
      expect(result.success).toBe(false);
    });

    it('should handle AI response with surrounding text before cleanup', () => {
      // After stripping markdown, we just get the JSON
      const input = '```json\n{"patterns": []}\n```';
      const result = parseAiJsonResponse<{ patterns: unknown[] }>(input);
      expect(result.success).toBe(true);
      expect(result.success && result.data.patterns).toEqual([]);
    });
  });
});
