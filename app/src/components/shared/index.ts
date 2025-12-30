/**
 * @file src/components/shared/index.ts
 * @purpose Barrel export for shared UI components
 * @functionality
 * - Exports ChunkErrorBoundary component for lazy-load error handling
 * - Exports DateBadge component
 * - Exports ExportDropdown component
 * - Exports InkBrushDecoration component
 * - Exports LanguageToggle component
 * - Exports LoadingFallback component for Suspense boundaries
 * - Exports PageNavigation component
 * - Exports ThemeToggle component
 * - Exports UserAvatarDropdown component
 * - Re-exports all icons from icons sub-barrel
 * @dependencies
 * - ./ChunkErrorBoundary
 * - ./DateBadge
 * - ./ExportDropdown
 * - ./InkBrushDecoration
 * - ./LanguageToggle
 * - ./LoadingFallback
 * - ./PageNavigation
 * - ./ThemeToggle
 * - ./UserAvatarDropdown
 * - ./icons
 */

export { default as ChunkErrorBoundary } from './ChunkErrorBoundary';
export { default as DateBadge } from './DateBadge';
export { default as ExportDropdown } from './ExportDropdown';
export { default as InkBrushDecoration } from './InkBrushDecoration';
export { default as LanguageToggle } from './LanguageToggle';
export { default as LoadingFallback } from './LoadingFallback';
export { default as PageNavigation } from './PageNavigation';
export { default as ThemeToggle } from './ThemeToggle';
export { default as UserAvatarDropdown } from './UserAvatarDropdown';

// Re-export all icons
export * from './icons'; // @allow-wildcard
