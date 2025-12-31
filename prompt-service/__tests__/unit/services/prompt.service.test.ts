/**
 * @file prompt-service/src/services/__tests__/prompt.service.test.ts
 * @purpose Unit tests for PromptService input validation
 * @functionality
 * - Tests prompt key validation format
 * - Tests content sanitization (XSS prevention)
 * - Verifies ValidationError is thrown for invalid input
 * @dependencies
 * - vitest for testing framework
 * - Sanitization utilities for validation
 */

import { ValidationError } from '@/errors';
import { validatePromptContent, validatePromptKey } from '@/utils';

describe('Prompt Validation', () => {
  describe('validatePromptKey', () => {
    it('should accept valid uppercase keys', () => {
      expect(() => { validatePromptKey('IDENTITY_ANALYSIS'); }).not.toThrow();
      expect(() => { validatePromptKey('TEST_PROMPT_1'); }).not.toThrow();
      expect(() => { validatePromptKey('A'); }).not.toThrow();
    });

    it('should reject lowercase keys', () => {
      expect(() => { validatePromptKey('invalid-key'); }).toThrow(ValidationError);
      expect(() => { validatePromptKey('lowercase'); }).toThrow(ValidationError);
    });

    it('should reject keys starting with numbers', () => {
      expect(() => { validatePromptKey('1_INVALID'); }).toThrow(ValidationError);
    });

    it('should reject keys with special characters', () => {
      expect(() => { validatePromptKey('TEST-KEY'); }).toThrow(ValidationError);
      expect(() => { validatePromptKey('TEST.KEY'); }).toThrow(ValidationError);
    });
  });

  describe('validatePromptContent', () => {
    it('should accept valid prompt content', () => {
      expect(() => { validatePromptContent('Analyze the following: {{data}}'); }).not.toThrow();
      expect(() => { validatePromptContent('You are an AI assistant.'); }).not.toThrow();
      expect(() => { validatePromptContent('Return JSON: {"key": "value"}'); }).not.toThrow();
    });

    it('should reject script tags', () => {
      expect(() => { validatePromptContent('<script>alert("xss")</script>'); }).toThrow(ValidationError);
      expect(() => { validatePromptContent('<SCRIPT src="evil.js"></SCRIPT>'); }).toThrow(ValidationError);
    });

    it('should reject event handlers', () => {
      expect(() => { validatePromptContent('<div onclick="evil()">Click</div>'); }).toThrow(ValidationError);
      expect(() => { validatePromptContent('<img onload="hack()" src="x">'); }).toThrow(ValidationError);
      expect(() => { validatePromptContent('<body onmouseover="steal()">'); }).toThrow(ValidationError);
    });

    it('should reject javascript: URLs', () => {
      expect(() => { validatePromptContent('<a href="javascript:alert(1)">'); }).toThrow(ValidationError);
    });

    it('should reject iframe tags', () => {
      expect(() => { validatePromptContent('<iframe src="evil.com"></iframe>'); }).toThrow(ValidationError);
    });

    it('should reject object and embed tags', () => {
      expect(() => { validatePromptContent('<object data="evil.swf">'); }).toThrow(ValidationError);
      expect(() => { validatePromptContent('<embed src="evil.swf">'); }).toThrow(ValidationError);
    });

    it('should reject data: URLs with HTML', () => {
      expect(() => { validatePromptContent('data: text/html,<script>evil()</script>'); }).toThrow(ValidationError);
    });

    it('should reject CSS expression hacks', () => {
      expect(() => { validatePromptContent('expression(alert(1))'); }).toThrow(ValidationError);
    });
  });
});
