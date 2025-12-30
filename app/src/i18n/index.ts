/**
 * @file src/i18n/index.ts
 * @purpose Barrel export for i18n configuration
 * @functionality
 * - Exports i18n instance
 * - Exports supported languages constant and type
 * @dependencies
 * - ./config
 */

export { default as i18n, SUPPORTED_LANGUAGES } from './config';
export type { SupportedLanguage } from './config';
