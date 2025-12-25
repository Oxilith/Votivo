/**
 * @file prompt-service/src/utils/sanitize.ts
 * @purpose Input validation and sanitization utilities for prompt content
 * @functionality
 * - Validates prompt content for potential script injection patterns
 * - Provides defense-in-depth against XSS attacks
 * - Checks for suspicious patterns like script tags and event handlers
 * @dependencies
 * - @/errors/index for ValidationError
 * - @/validators/prompt.validator for MAX_PROMPT_CONTENT_LENGTH
 */

import { ValidationError } from '@/errors/index.js';
import { MAX_PROMPT_CONTENT_LENGTH } from '@/validators/prompt.validator.js';

/**
 * Patterns that indicate potential script injection attempts
 * These are checked case-insensitively
 */
const SUSPICIOUS_PATTERNS = [
  /<script\b[^>]*>/i,
  /<\/script>/i,
  /javascript:/i,
  /on\w+\s*=/i, // Event handlers like onclick=, onload=, etc.
  /<iframe\b[^>]*>/i,
  /<object\b[^>]*>/i,
  /<embed\b[^>]*>/i,
  /<link\b[^>]*href\s*=\s*["']?javascript:/i,
  /data:\s*text\/html/i,
  /expression\s*\(/i, // CSS expression() hack
] as const;

/**
 * Validates prompt content for potential security issues
 * @param content - The prompt content to validate
 * @throws ValidationError if content exceeds max length or contains suspicious patterns
 */
export function validatePromptContent(content: string): void {
  // Length check first for DoS prevention (before expensive regex operations)
  if (content.length > MAX_PROMPT_CONTENT_LENGTH) {
    throw new ValidationError(
      `Prompt content exceeds maximum length of ${MAX_PROMPT_CONTENT_LENGTH} characters`
    );
  }

  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(content)) {
      throw new ValidationError(
        'Prompt content contains potentially unsafe patterns. Script tags, event handlers, and other executable content are not allowed.'
      );
    }
  }
}

/**
 * Validates a prompt key for allowed characters
 * Keys should be alphanumeric with underscores only
 * @param key - The prompt key to validate
 * @throws ValidationError if key contains invalid characters
 */
export function validatePromptKey(key: string): void {
  if (!/^[A-Z][A-Z0-9_]*$/.test(key)) {
    throw new ValidationError(
      'Prompt key must start with an uppercase letter and contain only uppercase letters, numbers, and underscores (e.g., IDENTITY_ANALYSIS)'
    );
  }
}
